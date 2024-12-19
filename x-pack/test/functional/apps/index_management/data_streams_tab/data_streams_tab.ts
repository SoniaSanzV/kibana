/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { FtrProviderContext } from '../../../ftr_provider_context';

export default ({ getPageObjects, getService }: FtrProviderContext) => {
  const pageObjects = getPageObjects(['common', 'indexManagement', 'header']);
  const toasts = getService('toasts');
  const log = getService('log');
  const browser = getService('browser');
  const es = getService('es');
  const security = getService('security');
  const testSubjects = getService('testSubjects');

  const TEST_DS_NAME = 'test-ds-1';

  describe('Data streams tab', function () {
    before(async () => {
      await log.debug('Creating required data stream');
      try {
        await es.indices.putIndexTemplate({
          name: `${TEST_DS_NAME}_index_template`,
          index_patterns: [TEST_DS_NAME],
          data_stream: {},
          _meta: {
            description: `Template for ${TEST_DS_NAME} testing index`,
          },
          template: {
            settings: { mode: undefined },
            mappings: {
              properties: {
                '@timestamp': {
                  type: 'date',
                },
              },
            },
            lifecycle: {
              // @ts-expect-error @elastic/elasticsearch enabled prop is not typed yet
              enabled: true,
            },
          },
        });

        await es.indices.createDataStream({
          name: TEST_DS_NAME,
        });
      } catch (e) {
        log.debug('[Setup error] Error creating test data stream');
        throw e;
      }

      await log.debug('Navigating to the data streams tab');
      await security.testUser.setRoles(['index_management_user']);
      await pageObjects.common.navigateToApp('indexManagement');
      // Navigate to the data streams tab
      await pageObjects.indexManagement.changeTabs('data_streamsTab');
      await pageObjects.header.waitUntilLoadingHasFinished();
    });

    after(async () => {
      await log.debug('Cleaning up created data stream');

      try {
        await es.indices.deleteDataStream({ name: TEST_DS_NAME });
        await es.indices.deleteIndexTemplate({
          name: `${TEST_DS_NAME}_index_template`,
        });
      } catch (e) {
        log.debug('[Teardown error] Error deleting test data stream');
        throw e;
      }
    });

    it('shows the details flyout when clicking on a data stream', async () => {
      // Open details flyout
      await pageObjects.indexManagement.clickDataStreamNameLink(TEST_DS_NAME);
      // Verify url is stateful
      const url = await browser.getCurrentUrl();
      expect(url).to.contain(`/data_streams/${TEST_DS_NAME}`);
      // Assert that flyout is opened
      expect(await testSubjects.exists('dataStreamDetailPanel')).to.be(true);
      // Close flyout
      await testSubjects.click('closeDetailsButton');
    });

    describe('shows the correct index mode in the details flyout', function () {
      it('standard index mode', async () => {
        // Open details flyout of existing data stream - it has standard index mode
        await pageObjects.indexManagement.clickDataStreamNameLink(TEST_DS_NAME);
        // Check that index mode detail exists and its label is "Standard"
        expect(await testSubjects.exists('indexModeDetail')).to.be(true);
        expect(await testSubjects.getVisibleText('indexModeDetail')).to.be('Standard');
        // Close flyout
        await testSubjects.click('closeDetailsButton');
      });

      it('logsdb index mode', async () => {
        // Create an index template with a logsdb index mode
        await es.indices.putIndexTemplate({
          name: `logsdb_index_template`,
          index_patterns: ['test-logsdb'],
          data_stream: {},
          template: {
            settings: { mode: 'logsdb' },
          },
        });
        // Create a data stream matching the index pattern of the index template above
        await es.indices.createDataStream({
          name: 'test-logsdb',
        });
        await browser.refresh();
        // Open details flyout of data stream
        await pageObjects.indexManagement.clickDataStreamNameLink('test-logsdb');
        // Check that index mode detail exists and its label is "LogsDB"
        expect(await testSubjects.exists('indexModeDetail')).to.be(true);
        expect(await testSubjects.getVisibleText('indexModeDetail')).to.be('LogsDB');
        // Close flyout
        await testSubjects.click('closeDetailsButton');
        // Delete data stream and index template
        await es.indices.deleteDataStream({ name: 'test-logsdb' });
        await es.indices.deleteIndexTemplate({
          name: `logsdb_index_template`,
        });
        await browser.refresh();
      });
    });

    it('allows to update data retention', async () => {
      // Open details flyout
      await pageObjects.indexManagement.clickDataStreamNameLink(TEST_DS_NAME);
      // Open the edit retention dialog
      await testSubjects.click('manageDataStreamButton');
      await testSubjects.click('editDataRetentionButton');

      // Disable infinite retention
      await testSubjects.click('infiniteRetentionPeriod > input');
      // Set the retention to 7 hours
      await testSubjects.setValue('dataRetentionValue', '7');
      await testSubjects.click('show-filters-button');
      await testSubjects.click('filter-option-h');

      // Submit the form
      await testSubjects.click('saveButton');

      // Expect to see a success toast
      const successToast = await toasts.getElementByIndex(1);
      expect(await successToast.getVisibleText()).to.contain('Data retention updated');
    });

    it('allows to disable data retention', async () => {
      // Open details flyout
      await pageObjects.indexManagement.clickDataStreamNameLink(TEST_DS_NAME);
      // Open the edit retention dialog
      await testSubjects.click('manageDataStreamButton');
      await testSubjects.click('editDataRetentionButton');

      // Disable infinite retention
      await testSubjects.click('dataRetentionEnabledField > input');

      // Submit the form
      await testSubjects.click('saveButton');

      // Expect to see a success toast
      const successToast = await toasts.getElementByIndex(1);
      expect(await successToast.getVisibleText()).to.contain('Data retention disabled');
    });

    describe('Modify Data streams index mode', () => {
      type IndexMode = 'standard' | 'logsdb';

      interface ModifyIndexModeParams {
        origin: IndexMode;
        destination: IndexMode;
      }

      const indexModeTypes: Record<IndexMode, { es: string; kibana: string; selector: string }> = {
        standard: {
          es: 'standard',
          kibana: 'Standard',
          selector: 'index_mode_standard',
        },
        logsdb: {
          es: 'logsdb',
          kibana: 'LogsDB',
          selector: 'index_mode_logsdb',
        },
      };

      const modifyDsIndexMode = async ({ origin, destination }: ModifyIndexModeParams) => {
        const dataStreamName = `ds-${origin}-to-${destination}`;
        const indexTemplateName = `it-${origin}-to-${destination}`;

        // Create an index template with a origin index mode
        await es.indices.putIndexTemplate({
          name: indexTemplateName,
          index_patterns: [dataStreamName],
          data_stream: {},
          template: {
            settings: {
              mode: indexModeTypes[origin].es,
            },
          },
        });
        // Create a data stream matching the index pattern of the index template above
        await es.indices.createDataStream({
          name: dataStreamName,
        });
        await browser.refresh();

        // Open details flyout of data stream
        await pageObjects.indexManagement.clickDataStreamNameLink(dataStreamName);
        // Check that index mode detail exists and its label is origin
        expect(await testSubjects.exists('indexModeDetail')).to.be(true);
        expect(await testSubjects.getVisibleText('indexModeDetail')).to.be(
          indexModeTypes[origin].kibana
        );
        // Close flyout
        await testSubjects.click('closeDetailsButton');
        // // Navigate to the templates tab
        await pageObjects.indexManagement.changeTabs('templatesTab');
        await pageObjects.header.waitUntilLoadingHasFinished();
        // // Edit template
        await pageObjects.indexManagement.clickIndexTemplateNameLink(indexTemplateName);
        await testSubjects.click('manageTemplateButton');
        await testSubjects.click('editIndexTemplateButton');

        // // Verify index mode is origin
        expect(await testSubjects.getVisibleText('indexModeField')).to.be(
          indexModeTypes[origin].kibana
        );
        // // Modify index mode
        await testSubjects.click('indexModeField');
        await testSubjects.click(indexModeTypes[destination].selector);

        // // Navigate to the last step of the wizard
        await testSubjects.click('nextButton');
        await testSubjects.click('nextButton');
        await testSubjects.click('nextButton');
        await testSubjects.click('nextButton');
        await testSubjects.click('nextButton');
        expect(await testSubjects.getVisibleText('indexModeValue')).to.be(
          indexModeTypes[destination].kibana
        );

        // // Click update template
        await pageObjects.indexManagement.clickNextButton();

        // // Verify index mode and close detail tab
        expect(await testSubjects.getVisibleText('indexModeValue')).to.be(
          indexModeTypes[destination].kibana
        );
        await testSubjects.click('closeDetailsButton');

        // // Navigate to the data streams tab
        await pageObjects.indexManagement.changeTabs('data_streamsTab');
        await pageObjects.header.waitUntilLoadingHasFinished();

        // // Open data stream
        await pageObjects.indexManagement.clickDataStreamNameLink(dataStreamName);
        // // Check that index mode detail exists and its label is destination index mode
        expect(await testSubjects.exists('indexModeDetail')).to.be(true);
        expect(await testSubjects.getVisibleText('indexModeDetail')).to.be(
          indexModeTypes[destination].kibana
        );
        // Close flyout
        await testSubjects.click('closeDetailsButton');

        try {
          await es.indices.deleteDataStream({ name: dataStreamName });
          await es.indices.deleteIndexTemplate({
            name: indexTemplateName,
          });
        } catch (e) {
          log.debug('[Teardown error] Error deleting test data stream');
          throw e;
        }
      };
      it('allows to upgrade data stream from standard to logsdb index mode', async () => {
        await modifyDsIndexMode({
          origin: 'standard',
          destination: 'logsdb',
        });
      });

      it('allows to downgrade data stream from logsdb to standard index mode', async () => {
        await modifyDsIndexMode({
          origin: 'logsdb',
          destination: 'standard',
        });
      });
    });
  });
};

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { EuiLoadingSpinner, EuiFlexItem, type EuiFlexGroupProps } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import { InsightDistributionBar } from './insight_distribution_bar';
import { severityAggregations } from '../../../../detections/components/alerts_kpis/alerts_summary_charts_panel/aggregations';
import { useSummaryChartData } from '../../../../detections/components/alerts_kpis/alerts_summary_charts_panel/use_summary_chart_data';
import {
  getIsAlertsBySeverityData,
  getSeverityColor,
} from '../../../../detections/components/alerts_kpis/severity_level_panel/helpers';
import { FormattedCount } from '../../../../common/components/formatted_number';
import { InvestigateInTimelineButton } from '../../../../common/components/event_details/investigate_in_timeline_button';
import { getDataProvider } from '../../../../common/components/event_details/use_action_cell_data_provider';

const ENTITY_ALERT_COUNT_ID = 'entity-alert-count';
const SEVERITIES = ['unknown', 'low', 'medium', 'high', 'critical'];

interface AlertCountInsightProps {
  /**
   * The name of the entity to filter the alerts by.
   */
  name: string;
  /**
   * The field name to filter the alerts by.
   */
  fieldName: 'host.name' | 'user.name';
  /**
   * The direction of the flex group.
   */
  direction?: EuiFlexGroupProps['direction'];
  /**
   * The data-test-subj to use for the component.
   */
  ['data-test-subj']?: string;
}

/*
 * Displays a distribution bar with the total alert count for a given entity
 */
export const AlertCountInsight: React.FC<AlertCountInsightProps> = ({
  name,
  fieldName,
  direction,
  'data-test-subj': dataTestSubj,
}) => {
  const uniqueQueryId = useMemo(() => `${ENTITY_ALERT_COUNT_ID}-${uuid()}`, []);
  const entityFilter = useMemo(() => ({ field: fieldName, value: name }), [fieldName, name]);

  const { items, isLoading } = useSummaryChartData({
    aggregations: severityAggregations,
    entityFilter,
    uniqueQueryId,
    signalIndexName: null,
  });
  const dataProviders = useMemo(
    () => [getDataProvider(fieldName, `timeline-indicator-${fieldName}-${name}`, name)],
    [fieldName, name]
  );

  const data = useMemo(() => (getIsAlertsBySeverityData(items) ? items : []), [items]);

  const alertStats = useMemo(
    () =>
      data
        .map((item) => ({
          key: item.key,
          count: item.value,
          color: getSeverityColor(item.key),
        }))
        .sort((a, b) => SEVERITIES.indexOf(a.key) - SEVERITIES.indexOf(b.key)),
    [data]
  );

  const totalAlertCount = useMemo(() => data.reduce((acc, item) => acc + item.value, 0), [data]);

  if (!isLoading && items.length === 0) return null;

  return (
    <EuiFlexItem data-test-subj={dataTestSubj}>
      {isLoading ? (
        <EuiLoadingSpinner size="m" data-test-subj={`${dataTestSubj}-loading-spinner`} />
      ) : (
        <InsightDistributionBar
          title={
            <FormattedMessage
              id="xpack.securitySolution.insights.alertCountTitle"
              defaultMessage="Alerts:"
            />
          }
          stats={alertStats}
          count={
            <div data-test-subj={`${dataTestSubj}-count`}>
              <InvestigateInTimelineButton
                asEmptyButton={true}
                dataProviders={dataProviders}
                flush={'both'}
              >
                <FormattedCount count={totalAlertCount} />
              </InvestigateInTimelineButton>
            </div>
          }
          direction={direction}
          data-test-subj={`${dataTestSubj}-distribution-bar`}
        />
      )}
    </EuiFlexItem>
  );
};

AlertCountInsight.displayName = 'AlertCountInsight';

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import type { WeightLog } from '../../types';

interface WeightChartProps {
  logs: WeightLog[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function WeightChart({ logs }: WeightChartProps) {
  if (logs.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No weight data yet. Add your first entry!</Text>
      </View>
    );
  }

  const data = logs.map((log) => ({
    value: log.weight_kg,
    label: formatLabel(log.logged_at),
    dataPointText: `${log.weight_kg}`,
  }));

  const maxY = Math.max(...logs.map((l) => l.weight_kg));
  const minY = Math.min(...logs.map((l) => l.weight_kg));
  const yRange = maxY - minY;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weight History (kg)</Text>
      <LineChart
        data={data}
        width={SCREEN_WIDTH - 64}
        height={180}
        color="#4CAF82"
        thickness={2}
        dataPointsColor="#2E7D52"
        dataPointsRadius={4}
        startFillColor="#4CAF8240"
        endFillColor="#4CAF8205"
        areaChart
        curved
        yAxisTextStyle={styles.axisText}
        xAxisLabelTextStyle={styles.axisText}
        maxValue={Math.ceil(maxY + yRange * 0.2)}
        minValue={Math.max(0, Math.floor(minY - yRange * 0.2))}
        noOfSections={4}
        xAxisThickness={1}
        yAxisThickness={1}
        xAxisColor="#E0E0E0"
        yAxisColor="#E0E0E0"
        rulesColor="#F5F5F5"
        showVerticalLines
        verticalLinesColor="#F5F5F5"
        hideDataPoints={logs.length > 20}
        isAnimated
      />
    </View>
  );
}

function formatLabel(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: '#9E9E9E',
    fontSize: 14,
  },
  axisText: {
    fontSize: 10,
    color: '#9E9E9E',
  },
});

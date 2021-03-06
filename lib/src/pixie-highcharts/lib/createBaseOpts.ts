import { ChartEvent } from './chart.model';

const chartEvents = [
  'addSeries',
  'afterPrint',
  'beforePrint',
  'click',
  'drilldown',
  'drillup',
  'drillupall',
  // 'load',
  'redraw',
  'render',
  'selection'
];

const seriesEvents = ['afterAnimate', 'checkboxClick', 'click', 'hide', 'legendItemClick', 'mouseOut', 'mouseOver', 'show'];
const pointEvents = ['click', 'drag', 'dragStart', 'drop', 'mouseOut', 'mouseOver', 'remove', 'select', 'unselect', 'update'];
const xAxisEvents = ['afterBreaks', 'afterSetExtremes', 'pointBreak', 'pointInBreak', 'setExtremes'];
const yAxisEvents = ['afterBreaks', 'afterSetExtremes', 'pointBreak', 'pointInBreak', 'setExtremes'];
const zAxisEvents = ['afterBreaks', 'afterSetExtremes', 'pointBreak', 'pointInBreak', 'setExtremes'];
const colorAxisEvents = ['afterSetExtremes', 'legendItemClick', 'setExtremes'];
const navigationEvents = ['deselectButton', 'hidePopup', 'selectButton', 'showPopup'];

export function createBaseOpts(chartCmp, seriesCmp, pointCmp, xAxisCmp, yAxisCmp, zAxisCmp, colorAxisCmp, navigationCmp, element) {
  const opts: any = {
    chart: { renderTo: element, events: {} },
    plotOptions: { series: { events: {}, point: { events: {} } } }
  };

  chartEvents.forEach(function(eventName) {
    opts.chart.events[eventName] =
      opts.chart.events[eventName] ||
      function(event: any) {
        if (eventName === 'click') {
          chartCmp['chartClick'].emit(new ChartEvent(event, this));
        } else {
          chartCmp[eventName].emit(new ChartEvent(event, this));
        }
      };
  });
  if (seriesCmp) {
    seriesEvents.forEach(function(eventName) {
      opts.plotOptions.series.events[eventName] =
        opts.plotOptions.series.events[eventName] ||
        function(event: any) {
          seriesCmp[eventName].emit(new ChartEvent(event, this));
        };
    });
  }
  if (pointCmp) {
    pointEvents.forEach(function(eventName) {
      opts.plotOptions.series.point.events[eventName] =
        opts.plotOptions.series.point.events[eventName] ||
        function(event: any) {
          pointCmp[eventName].emit(new ChartEvent(event, this));
        };
    });
  }
  if (colorAxisCmp) {
    opts.colorAxis = { events: {} };
    colorAxisEvents.forEach(function(eventName) {
      opts.colorAxis.events[eventName] =
        opts.colorAxis.events[eventName] ||
        function(event: any) {
          colorAxisCmp[eventName].emit(new ChartEvent(event, this));
        };
    });
  }
  if (navigationCmp) {
    opts.navigation = { events: {} };
    navigationEvents.forEach(function(eventName) {
      opts.navigation.events[eventName] =
        opts.navigation.events[eventName] ||
        function(event: any) {
          navigationCmp[eventName].emit(new ChartEvent(event, this));
        };
    });
  }

  if (xAxisCmp) {
    opts.xAxis = { events: {} };
    xAxisEvents.forEach(function(eventName) {
      opts.xAxis.events[eventName] =
        opts.xAxis.events[eventName] ||
        function(event: any) {
          xAxisCmp[eventName].emit(new ChartEvent(event, this));
        };
    });
  }
  if (yAxisCmp) {
    opts.yAxis = { events: {} };
    yAxisEvents.forEach(function(eventName) {
      opts.yAxis.events[eventName] =
        opts.yAxis.events[eventName] ||
        function(event: any) {
          yAxisCmp[eventName].emit(new ChartEvent(event, this));
        };
    });
  }
  if (zAxisCmp) {
    opts.zAxis = { events: {} };
    zAxisEvents.forEach(function(eventName) {
      opts.zAxis.events[eventName] =
        opts.zAxis.events[eventName] ||
        function(event: any) {
          zAxisCmp[eventName].emit(new ChartEvent(event, this));
        };
    });
  }

  return opts;
}

import { Component, ElementRef, Input, Output, ContentChild, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import * as Highcharts from 'highcharts';

import { Export } from './lib/chart.model';
import { ChartSeriesComponent } from './lib/chart-series.component';
import { ChartXAxisComponent } from './lib/chart-xAxis.component';
import { ChartYAxisComponent } from './lib/chart-yAxis.component';
import { ChartZAxisComponent } from './lib/chart-zAxis.component';
import { ChartColorAxisComponent } from './lib/chart-colorAxis.component';
import { ChartNavigationComponent } from './lib/chart-navigation.component';
import { ChartEvent } from './lib/chart.model';

import { createBaseOpts } from './lib/createBaseOpts';
import { deepAssign } from './lib/deepAssign';
import { prefixConversion } from './lib/prefixConversion';
import { event } from './lib/event';
import { config } from './lib/config';

import { HighchartsService } from './lib/highcharts.service';
import { LocaleService } from './lib/locale.service';

@Component({
  selector: 'pixie-highcharts',
  templateUrl: './pixie-highcharts.component.html',
  styleUrls: ['./pixie-highcharts.component.scss'],
  providers: [HighchartsService, LocaleService]
})
export class PixieHighChartsComponent implements OnInit, OnChanges {
  @Input() id: string;
  @Input() type: string;
  @Input() zoomType: string;
  @Input() title: Object;
  @Input() xAxis: Object;
  @Input() yAxis: Object;
  @Input() zAxis: Object;
  @Input() tooltip: Object;
  @Input() export: Export;
  @Input() colors: Array<string>;
  @Input() colorAxis: Object;
  @Input() footer: string;
  @Input() data: Array<any>;
  @Input() config: Object;

  // #Tools
  // T-Show Legend
  @Input() isLegend: Boolean = true;
  // F-UTC is Active for UnixTimestamp Conversation, T= UTC+0
  @Input() isUTC: Boolean = false;
  // T-Polar Shape like Radar
  @Input() isPolar: Boolean = false;
  // T-Boost the Chart
  @Input() isBoost: Boolean = false;

  // T-Gap Size Between Each Point, Day2Day Disconnected: Display a gap in the graph
  @Input() isGap: Boolean = false;
  @Input() gapSize: Number = 1000 * 60 * 60 * 24;
  @Input() gapUnit: String = 'value';

  // T-Each Point Wont Have the Hours, Day2Day Connected: X axis range that each point is valid for
  @Input() isPointRange: Boolean = false;
  @Input() pointRange: Number = 1000 * 60 * 60 * 24;

  // T-Active the Y-Axis Prefix F-Dont Convert Legend
  @Input() isAxisPrefix: Boolean = false;
  @Input() axisPrefixFloat: Number = 2;

  // Plot Option
  @Input() isStock: Boolean = false;
  @Input() isMap: Boolean = false;
  @Input() isStacked: Boolean = false;
  @Input() isGroup: Boolean = false;

  // Highstock
  @Input() rangeSelector: Object;
  @Input() isRangeSelector: Boolean = true;
  @Input() isRangeInput: Boolean = false;
  @Input() navigator: Object;
  @Input() navigatorData: Object;
  @Input() isXScrollbar: Boolean = false;
  @Input() isYScrollbar: Boolean = false;

  // Event
  @Output() addSeries = new EventEmitter<ChartEvent>();
  @Output() afterPrint = new EventEmitter<ChartEvent>();
  @Output() beforePrint = new EventEmitter<ChartEvent>();
  @Output() chartClick = new EventEmitter<ChartEvent>();
  @Output() drilldown = new EventEmitter<ChartEvent>();
  @Output() drillup = new EventEmitter<ChartEvent>();
  @Output() drillupall = new EventEmitter<ChartEvent>();
  @Output() load = new EventEmitter<ChartEvent>();
  @Output() redraw = new EventEmitter<ChartEvent>();
  @Output() render = new EventEmitter<ChartEvent>();
  @Output() selection = new EventEmitter<ChartEvent>();

  @ContentChild(ChartSeriesComponent) chartSeriesComponent: ChartSeriesComponent;
  @ContentChild(ChartXAxisComponent) chartXAxisComponent: ChartXAxisComponent;
  @ContentChild(ChartYAxisComponent) chartYAxisComponent: ChartYAxisComponent;
  @ContentChild(ChartZAxisComponent) chartZAxisComponent: ChartZAxisComponent;
  @ContentChild(ChartColorAxisComponent) chartColorAxisComponent: ChartColorAxisComponent;
  @ContentChild(ChartNavigationComponent) chartNavigationComponent: ChartNavigationComponent;

  public Highcharts;
  public constructorType = 'chart';
  public options: any;
  public chart: any;
  public updateFlag: Boolean = false;

  private element: ElementRef;
  private globalPXH: any;
  private i18nNoDataAvailable = 'No Data Available';

  constructor(element: ElementRef, highchartsService: HighchartsService, localeService: LocaleService) {
    this.element = element;
    this.Highcharts = highchartsService.getHighchartsStatic();
    this.initCustomHighCharts();

    localeService.getLocale().subscribe(d => {
      this.i18nNoDataAvailable = d.noDataAvailable === '' ? 'No Data Available' : d.noDataAvailable;
      d.resetZoom = d.resetZoom === '' ? 'Reset Zoom' : d.resetZoom;
      Highcharts.setOptions({ lang: d });

      if (typeof this.title === 'undefined') {
        validateSeries(this.data, this.chart, this.i18nNoDataAvailable);
      } else {
        if (!this.title.hasOwnProperty('subtitle')) {
          validateSeries(this.data, this.chart, this.i18nNoDataAvailable);
        }
      }

      this.chart.redraw(false);

      function validateSeries(data, chart, noDataAvailableText) {
        if (data.length === 0) {
          if (!isSameString(chart, noDataAvailableText)) {
            chart.setSubtitle({ text: noDataAvailableText });
          }
        }
      }

      function isSameString(chart, noDataAvailableText) {
        return chart.subtitle.textStr === noDataAvailableText ? true : false;
      }
    });
  }

  async ngOnInit() {
    const opts: Object = this.plotOptionConfigure();
    opts['exporting'] = this.exportingConfigure(this.export);

    if (this.id === undefined) {
      this.id = this.generateID();
    }
    if (typeof this.type !== 'undefined') {
      // Type : column(Vertical Bar), bar(Horizontal Bar), line, area, pie, scatter and etc.
      opts['chart'] = {};
      opts['chart']['type'] = this.type;
    } else {
      opts['chart'] = {};
      opts['chart']['type'] = 'line';
      this.type = 'line';
    }

    if (this.isPolar) {
      opts['chart']['polar'] = true;
    }

    opts['chart']['panning'] = true;
    opts['chart']['panKey'] = 'ctrl';

    if (this.isStock) {
      this.constructorType = 'stockChart';
      opts['chart']['spacingTop'] = 5;
      // Adjust the title between navigator
      if (typeof this.xAxis !== 'undefined') {
        if (this.xAxis.hasOwnProperty('title')) {
          opts['chart']['marginBottom'] = 30;
        } else {
          opts['chart']['marginBottom'] = 20;
        }
      } else {
        opts['chart']['marginBottom'] = 20;
      }

      if (typeof this.rangeSelector !== 'undefined') {
        opts['rangeSelector'] = this.rangeSelector;
      } else {
        opts['rangeSelector'] = {};
      }

      if (!this.isRangeSelector) {
        opts['rangeSelector']['enabled'] = false;
      }

      if (!this.isRangeInput) {
        opts['rangeSelector']['inputEnabled'] = false;
      }

      if (typeof this.navigator !== 'undefined') {
        opts['navigator'] = this.navigator;
        if (!this.navigator.hasOwnProperty('height')) {
          opts['navigator']['height'] = 20;
        }

        if (typeof this.navigatorData !== 'undefined') {
          opts['navigator']['series'] = this.navigatorData;
        }
      } else {
        opts['navigator'] = {};
        opts['navigator']['height'] = 20;

        if (typeof this.navigatorData !== 'undefined') {
          opts['navigator']['series'] = this.navigatorData;
        }
      }
    }

    if (this.isMap) {
      this.constructorType = 'mapChart';
    }

    if (this.isBoost) {
      opts['chart']['animation'] = false;
      opts['boost'] = {};
      opts['boost']['usePreAllocated'] = true;
      // opts['chart']['boost']['useGPUTranslations'] = true;
      // opts['boost'] = {};
      // opts['boost']['useGPUTranslations'] = true;
      // opts['boost']['usePreAllocated'] = true;
    } else {
      opts['boost'] = {};
      opts['boost']['enabled'] = false;
    }

    if (typeof this.title !== 'undefined') {
      if (typeof this.title['title'] !== 'undefined') {
        opts['title'] = {};
        opts['title']['text'] = this.title['title'];
      } else {
        opts['title'] = {};
        opts['title']['text'] = null;
        opts['title']['floating'] = true;
      }
      if (typeof this.title['subtitle'] !== 'undefined') {
        opts['subtitle'] = {};
        opts['subtitle']['text'] = this.title['subtitle'];
      } else {
        opts['subtitle'] = {};
        opts['subtitle']['text'] = null;
      }
    } else {
      opts['title'] = {};
      opts['title']['text'] = null;

      try {
        if (this.data.length === 0) {
          opts['subtitle'] = {};
          opts['subtitle']['text'] = this.i18nNoDataAvailable;
        } else {
          opts['subtitle'] = {};
          opts['subtitle']['text'] = null;
        }
      } catch (e) {
        opts['subtitle'] = {};
        opts['subtitle']['text'] = this.i18nNoDataAvailable;
      }
    }

    if (typeof this.zoomType !== 'undefined') {
      // X Y XY
      opts['chart']['zoomType'] = this.zoomType;
    }

    if (typeof this.data !== 'undefined') {
      opts['series'] = this.data;
    }

    if (typeof this.xAxis !== 'undefined') {
      if (Array.isArray(this.xAxis)) {
        opts['xAxis'] = [];
        this.xAxis.forEach(d => {
          if (!d.hasOwnProperty('title')) {
            d['title'] = {};
            d['title']['text'] = null;
          }

          if (d.hasOwnProperty('type')) {
            if (d['type'] === 'datetime') {
              if (!d.hasOwnProperty('dateTimeLabelFormats')) {
                d['dateTimeLabelFormats'] = this.globalPXH.dateTimeLabelFormats;
              }
            }
          }
          opts['xAxis'].push(d);
        });
      } else {
        opts['xAxis'] = this.xAxis;
        if (!this.xAxis.hasOwnProperty('title')) {
          opts['xAxis']['title'] = {};
          opts['xAxis']['title']['text'] = null;
        }

        if (this.xAxis.hasOwnProperty('type')) {
          if (this.xAxis['type'] === 'datetime') {
            if (!this.xAxis.hasOwnProperty('dateTimeLabelFormats')) {
              this.xAxis['dateTimeLabelFormats'] = this.globalPXH.dateTimeLabelFormats;
            }
          }
        }
      }
    } else {
      opts['xAxis'] = {};
      opts['xAxis']['title'] = {};
      opts['xAxis']['title']['text'] = null;
    }

    const axisFloat = this.axisPrefixFloat;
    if (typeof this.yAxis !== 'undefined') {
      if (Array.isArray(this.yAxis)) {
        opts['yAxis'] = [];
        this.yAxis.forEach(d => {
          if (!d.hasOwnProperty('title')) {
            d['title'] = {};
            d['title']['text'] = null;
          }

          if (this.isAxisPrefix) {
            d['labels'] = {};
            d['labels']['formatter'] = function() {
              return prefixConversion(this.value, axisFloat);
            };
          }
          opts['yAxis'].push(d);
        });
      } else {
        opts['yAxis'] = this.yAxis;

        if (this.isAxisPrefix) {
          opts['yAxis']['labels'] = {};
          opts['yAxis']['labels']['formatter'] = function() {
            return prefixConversion(this.value, axisFloat);
          };
        }

        if (!this.yAxis.hasOwnProperty('title')) {
          opts['yAxis']['title'] = {};
          opts['yAxis']['title']['text'] = null;
        }
      }
    } else {
      opts['yAxis'] = {};

      if (this.isAxisPrefix) {
        opts['yAxis']['labels'] = {};
        opts['yAxis']['labels']['formatter'] = function() {
          return prefixConversion(this.value, axisFloat);
        };
      }

      opts['yAxis']['title'] = {};
      opts['yAxis']['title']['text'] = null;
    }

    if (typeof this.zAxis !== 'undefined') {
      opts['zAxis'] = this.zAxis;
    }

    if (typeof this.colors !== 'undefined') {
      opts['colors'] = this.colors;
    }

    if (typeof this.colorAxis !== 'undefined') {
      opts['colorAxis'] = this.colorAxis;
    }

    if (this.isUTC) {
      opts['time'] = {};
      opts['time']['useUTC'] = this.isUTC;
    }

    if (typeof this.tooltip !== 'undefined') {
      opts['tooltip'] = this.tooltip;
      opts['tooltip']['followPointer'] = true;
    } else {
      opts['tooltip'] = this.globalPXH.standardTooltipDesign;
      opts['tooltip']['followPointer'] = true;
    }

    if (this.isStock) {
      opts['tooltip']['split'] = false;
      opts['tooltip']['positioner'] = function() {
        return { x: 1, y: 1 };
      };
    } else {
      opts['tooltip']['positioner'] = function() {
        return { x: 1, y: 1 };
      };
    }

    if (typeof this.footer !== 'undefined') {
      opts['credits'] = {};
      opts['credits']['text'] = this.footer;
      opts['credits']['href'] = this.globalPXH.footerURL;
    } else {
      opts['credits'] = {};
      opts['credits']['enabled'] = false;
    }

    if (this.isLegend) {
      opts['legend'] = {};
      opts['legend']['verticalAlign'] = this.globalPXH.legendPosition;
      if (this.globalPXH.legendPosition === 'top') {
        opts['chart']['spacingTop'] = 0;
      }
    } else {
      opts['legend'] = {};
      opts['legend']['enabled'] = false;
    }

    opts['drilldown'] = {};
    opts['drilldown']['animation'] = false;
    opts['drilldown']['series'] = [];

    opts['drilldown']['drillUpButton'] = {};
    opts['drilldown']['drillUpButton']['relativeTo'] = 'chart';

    if (typeof this.config !== 'undefined') {
      const allKey = Object.keys(this.config);
      for (const key of allKey) {
        opts[key] = deepAssign({}, opts[key], this.config[key]);
      }
    }

    const eventOption = createBaseOpts(
      this,
      this.chartSeriesComponent,
      this.chartSeriesComponent ? this.chartSeriesComponent.point : null,
      this.chartXAxisComponent,
      this.chartYAxisComponent,
      this.chartZAxisComponent,
      this.chartColorAxisComponent,
      this.chartNavigationComponent,
      this.element.nativeElement
    );

    this.options = deepAssign({}, opts, eventOption);

    if (this.globalPXH.debug) {
      console.log(`---${this.type}#${this.id}---`);
      console.log('Option: ', this.options);
    }
    if (this.globalPXH.debugStringify) {
      console.log('Option [S]: ', JSON.stringify(this.options));
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    try {
      if (this.globalPXH.debug) {
        console.log(`---${this.type}#${this.id}---`);
        console.log('Changes: ', changes);
      }
      if (this.globalPXH.debugStringify) {
        console.log('Changes [S]: ', JSON.stringify(changes));
      }

      let redraw: Boolean = false;
      const updateOption: any = {};

      if (typeof changes.type !== 'undefined' && !changes.type.firstChange) {
        if (!updateOption.hasOwnProperty('chart')) {
          updateOption.chart = {};
        }
        updateOption.chart.type = changes.type.currentValue;
        redraw = true;
      }

      if (typeof changes.zoomType !== 'undefined' && !changes.zoomType.firstChange) {
        if (!updateOption.hasOwnProperty('chart')) {
          updateOption.chart = {};
        }
        updateOption.chart.zoomType = changes.zoomType.currentValue;
        redraw = true;
      }

      if (typeof changes.data !== 'undefined' && !changes.data.firstChange) {
        updateOption.series = changes.data.currentValue;
        redraw = true;
      }

      if (typeof changes.title !== 'undefined' && !changes.title.firstChange) {
        const title = { title: { text: null }, subtitle: { text: null } };
        if (changes.title.currentValue.hasOwnProperty('title')) {
          title.title.text = changes.title.currentValue.title;
        }

        if (changes.title.currentValue.hasOwnProperty('subtitle')) {
          title.subtitle.text = changes.title.currentValue.subtitle;
        }
        updateOption.title = title.title;
        updateOption.subtitle = title.subtitle;
        redraw = true;
      }

      if (typeof changes.xAxis !== 'undefined' && !changes.xAxis.firstChange) {
        updateOption.xAxis = changes.xAxis.currentValue;
        redraw = true;
      }

      if (typeof changes.yAxis !== 'undefined' && !changes.yAxis.firstChange) {
        updateOption.yAxis = changes.yAxis.currentValue;
        redraw = true;
      }

      if (typeof changes.zAxis !== 'undefined' && !changes.zAxis.firstChange) {
        updateOption.zAxis = changes.zAxis.currentValue;
        redraw = true;
      }

      if (typeof changes.tooltip !== 'undefined' && !changes.tooltip.firstChange) {
        updateOption.tooltip = changes.tooltip.currentValue;
        redraw = true;
      }

      if (typeof changes.footer !== 'undefined' && !changes.footer.firstChange) {
        updateOption.credits = { text: changes.footer.currentValue };
        redraw = true;
      }

      if (typeof changes.colors !== 'undefined' && !changes.colors.firstChange) {
        updateOption.colors = changes.colors.currentValue;
        redraw = true;
      }

      if (typeof changes.colorAxis !== 'undefined' && !changes.colorAxis.firstChange) {
        updateOption.colorAxis = changes.colorAxis.currentValue;
        redraw = true;
      }

      if (typeof changes.navigator !== 'undefined' && !changes.navigator.firstChange) {
        const navigator: any = changes.navigator.currentValue;
        if (!navigator.hasOwnProperty('height')) {
          navigator.height = 20;
        }
        updateOption.navigator = navigator;
        redraw = true;
      }

      if (typeof changes.navigatorData !== 'undefined' && !changes.navigatorData.firstChange) {
        if (!updateOption.hasOwnProperty('navigator')) {
          updateOption.navigator = {};
        }
        updateOption.navigator.series = changes.navigatorData.currentValue;
        redraw = true;
      }

      if (typeof changes.isLegend !== 'undefined' && !changes.isLegend.firstChange) {
        if (!updateOption.hasOwnProperty('chart')) {
          updateOption.chart = {};
        }

        if (changes.isLegend.currentValue) {
          updateOption.chart.spacingTop = 10;
        } else {
          updateOption.chart.spacingTop = 0;
        }

        updateOption.legend = {};
        updateOption.legend.enabled = changes.isLegend.currentValue;
        redraw = true;
      }

      if (typeof changes.isUTC !== 'undefined' && !changes.isUTC.firstChange) {
        updateOption.time = {};
        updateOption.time.useUTC = changes.isUTC.currentValue;
        redraw = true;
      }

      if (
        (typeof changes.isAxisPrefix !== 'undefined' && !changes.isAxisPrefix.firstChange) ||
        (typeof changes.axisPrefixFloat !== 'undefined' && !changes.axisPrefixFloat.firstChange)
      ) {
        const axisFloat = this.axisPrefixFloat;
        if (this.isAxisPrefix) {
          this.complexOptionAssignment(updateOption, 'yAxis', {
            labels: {
              formatter: function() {
                return prefixConversion(this.value, axisFloat);
              }
            }
          });
        } else {
          this.complexOptionAssignment(updateOption, 'yAxis', { labels: { formatter: undefined } });
        }

        redraw = true;
      }

      // #plotOption - Redraw
      if (
        (typeof changes.isStacked !== 'undefined' && !changes.isStacked.firstChange) ||
        (typeof changes.isGroup !== 'undefined' && !changes.isGroup.firstChange) ||
        (typeof changes.isPointRange !== 'undefined' && !changes.isPointRange.firstChange) ||
        (typeof changes.isGap !== 'undefined' && !changes.isGap.firstChange) ||
        (typeof changes.isBoost !== 'undefined' && !changes.isBoost.firstChange)
      ) {
        updateOption.plotOptions = this.plotOptionConfigure(true)['plotOptions'];
        redraw = true;
      }

      if (typeof changes.export !== 'undefined' && !changes.export.firstChange) {
        updateOption.exporting = this.exportingConfigure(changes.export.currentValue, true);
        redraw = true;
      }

      // #Stock
      if (typeof changes.isRangeSelector !== 'undefined' && !changes.isRangeSelector.firstChange) {
        if (!updateOption.hasOwnProperty('rangeSelector')) {
          updateOption.rangeSelector = {};
        }

        updateOption.rangeSelector.enabled = changes.isRangeSelector.currentValue;
        redraw = true;
      }

      if (typeof changes.isRangeInput !== 'undefined' && !changes.isRangeInput.firstChange) {
        if (!updateOption.hasOwnProperty('rangeSelector')) {
          updateOption.rangeSelector = {};
        }

        updateOption.rangeSelector.inputEnabled = changes.isRangeInput.currentValue;
        redraw = true;
      }

      if (typeof changes.config !== 'undefined' && !changes.config.firstChange) {
        const allKey = Object.keys(changes.config.currentValue);
        for (const key of allKey) {
          updateOption[key] = deepAssign({}, updateOption[key], changes.config.currentValue[key]);
        }
        redraw = true;
      }

      if (
        (typeof changes.isXScrollbar !== 'undefined' && !changes.isXScrollbar.firstChange) ||
        (typeof changes.isYScrollbar !== 'undefined' && !changes.isYScrollbar.firstChange)
      ) {
        event.removeMouseWheel(this.chart);

        if (this.isXScrollbar) {
          event.addXScrollMouseWheel(this.chart);
        }

        if (this.isYScrollbar) {
          event.addYScrollMouseWheel(this.chart);
        }
      }

      // # Data Validation
      if (typeof this.title === 'undefined') {
        this.validateSeries(updateOption);
        redraw = true;
      } else {
        if (this.title.hasOwnProperty('subtitle')) {
          this.validateSeries(updateOption, true);
        } else {
          this.validateSeries(updateOption);
        }
        redraw = true;
      }

      if (redraw) {
        this.options = updateOption;
        this.updateFlag = redraw;

        if (this.globalPXH.debug) {
          console.log(`---${this.type}#${this.id}---`);
          console.log('Updated: ', updateOption);
        }
        if (this.globalPXH.debugStringify) {
          console.log('Updated [S]: ', JSON.stringify(updateOption));
        }
      }
    } catch (e) {
      console.log(`---${this.type}#${this.id}---`);
      console.log('Change Error: ', e);
      if (this.globalPXH.debug) {
        console.log(e);
      }
    }
  }

  saveInstance(chartInstance) {
    this.chart = chartInstance;
    this.load.emit(chartInstance);

    if (this.isXScrollbar) {
      event.addXScrollMouseWheel(this.chart);
    }

    if (this.isYScrollbar) {
      event.addXScrollMouseWheel(this.chart);
    }
  }

  plotOptionConfigure(update = false) {
    const standard = {
      plotOptions: {
        series: {},
        bar: { grouping: false, groupPadding: 0, pointPadding: 0.2, borderWidth: 0, turboThreshold: 0 },
        column: { grouping: false, groupPadding: 0, pointPadding: 0.2, borderWidth: 0, turboThreshold: 0 },
        line: { marker: { symbol: 'circle' }, turboThreshold: 0 },
        spline: { marker: { symbol: 'circle' }, turboThreshold: 0 },
        boxplot: { turboThreshold: 0 },
        pie: { allowPointSelect: true, cursor: 'pointer', dataLabels: { enabled: false }, showInLegend: true },
        scatter: {
          marker: { symbol: 'circle', radius: 2, states: { hover: { enabled: true } } },
          states: { hover: { marker: { enabled: false } } },
          turboThreshold: 0,
          stickyTracking: false
        }
      }
    };

    const combination = { plotOptions: { bar: { stacking: 'normal' }, column: { stacking: 'normal' } } };
    const group = { plotOptions: { bar: { grouping: true }, column: { grouping: true } } };

    let plotOption = { plotOptions: {} };
    if (!update) {
      plotOption = standard;
    } else {
      plotOption['plotOptions'][this.type] = {};
    }

    if (this.isStacked) {
      plotOption = deepAssign({}, plotOption, combination);
    } else {
      if (update) {
        plotOption['plotOptions'][this.type]['stacking'] = undefined;
      }
    }

    if (this.isGroup) {
      plotOption = deepAssign({}, plotOption, group);
    } else {
      if (update) {
        plotOption['plotOptions'][this.type]['grouping'] = false;
      }
    }

    if (this.isGap) {
      plotOption['plotOptions'][this.type]['gapSize'] = this.gapSize;
      plotOption['plotOptions'][this.type]['gapUnit'] = this.gapUnit;
    } else {
      if (update) {
        plotOption['plotOptions'][this.type]['gapSize'] = 0;
        plotOption['plotOptions'][this.type]['gapUnit'] = 'relative';
      }
    }

    if (this.isPointRange) {
      plotOption['plotOptions'][this.type]['pointRange'] = this.pointRange;
    } else {
      if (update) {
        plotOption['plotOptions'][this.type]['pointRange'] = null;
      }
    }

    if (this.isBoost) {
      plotOption['plotOptions'][this.type]['boostThreshold'] = 1000000;
      plotOption['plotOptions'][this.type]['turboThreshold'] = Number.MAX_VALUE;
      plotOption['plotOptions'][this.type]['cropThreshold'] = Infinity;
    }

    return plotOption;
  }

  initCustomHighCharts() {
    try {
      const Highchart = this.Highcharts;
      if (Highchart.hasOwnProperty('globalPXH')) {
        this.globalPXH = Highchart['globalPXH'];

        if (!this.globalPXH.hasOwnProperty('url')) {
          this.globalPXH.url = config.url;
        }

        if (!this.globalPXH.hasOwnProperty('standardTooltipDesign')) {
          this.globalPXH.standardTooltipDesign = config.standardTooltipDesign;
        }

        if (!this.globalPXH.hasOwnProperty('dateTimeLabelFormats')) {
          this.globalPXH.dateTimeLabelFormats = config.dateTimeLabelFormats;
        }

        if (!this.globalPXH.hasOwnProperty('sameLegendSymbol')) {
          this.globalPXH.sameLegendSymbol = config.sameLegendSymbol;
        }

        if (!this.globalPXH.hasOwnProperty('legendPosition')) {
          this.globalPXH.legendPosition = config.legendPosition;
        }

        if (!this.globalPXH.hasOwnProperty('exportTheme')) {
          this.globalPXH.exportTheme = config.exportTheme;
        } else {
          this.globalPXH.exportTheme = deepAssign({}, this.globalPXH.exportTheme, config.exportTheme);
        }

        if (!this.globalPXH.hasOwnProperty('filename')) {
          this.globalPXH.filename = config.filename;
        }

        if (!this.globalPXH.hasOwnProperty('debug')) {
          this.globalPXH.debug = config.debug;
        }

        if (!this.globalPXH.hasOwnProperty('debugStringify')) {
          this.globalPXH.debugStringify = config.debugStringify;
        }
      } else {
        this.declareGlobalPXH();
      }
    } catch (e) {
      this.declareGlobalPXH();

      console.log('Init Error: ', e);
      if (this.globalPXH.debug) {
        console.log(`---${this.type}#${this.id}---`);
        console.log(e);
      }
    }

    Highcharts['SVGRenderer'].prototype.symbols['cross'] = function(x, y, w, h) {
      return ['M', x, y, 'L', x + w, y + h, 'M', x + w, y, 'L', x, y + h, 'z'];
    };

    try {
      if (this.globalPXH.sameLegendSymbol) {
        Highcharts['seriesTypes'][this.type].prototype.drawLegendSymbol = Highcharts['seriesTypes']['column'].prototype.drawLegendSymbol;
      }
    } catch (e) {
      console.log('DrawLegendSymbol Error: ', e);
      if (this.globalPXH.debug) {
        console.log(`---${this.type}#${this.id}---`);
        console.log(e);
      }
    }
  }

  exportingConfigure(exportParam: Export, update = false) {
    let standard: any = {
      enabled: false,
      customExport: false,
      fallbackToExportServer: false,
      sourceHeight: 600,
      sourceWidth: 800,
      chartOptions: this.globalPXH.exportTheme,
      filename: this.globalPXH.filename
    };

    if (update) {
      standard = {
        chartOptions: {
          chart: {},
          title: {},
          subtitle: {}
        }
      };
    }

    if (typeof exportParam !== 'undefined') {
      if (typeof exportParam.title !== 'undefined') {
        standard.chartOptions.title.text = exportParam.title;
      }

      if (typeof exportParam.subtitle !== 'undefined') {
        standard.chartOptions.subtitle.text = exportParam.subtitle;
      }

      if (typeof exportParam.filename !== 'undefined') {
        standard.filename = `${exportParam.filename}_${this.getCurrentDate()}`;
      } else {
        standard.filename = `${standard.filename}_${this.getCurrentDate()}`;
      }

      if (typeof exportParam.enabled !== 'undefined') {
        standard.enabled = exportParam.enabled;
      }

      if (typeof exportParam.fallbackToExportServer !== 'undefined') {
        standard.fallbackToExportServer = exportParam.fallbackToExportServer;
      }

      if (typeof exportParam.customExport !== 'undefined') {
        standard.customExport = exportParam.customExport;
      }

      if (typeof exportParam.scale !== 'undefined') {
        if (exportParam.scale === 1) {
          standard.sourceHeight = 300;
          standard.sourceWidth = 400;
        } else if (exportParam.scale === 2) {
          standard.sourceHeight = 400;
          standard.sourceWidth = 500;
        } else if (exportParam.scale === 3) {
          // Great for Legend Less than 5
          standard.sourceHeight = 500;
          standard.sourceWidth = 600;
        } else if (exportParam.scale === 4) {
          // Great for Legend More than 5, Less than 20
          standard.sourceHeight = 600;
          standard.sourceWidth = 700;
        } else if (exportParam.scale === 5) {
          // Great for Legend More than 5, Less than 20
          standard.sourceHeight = 700;
          standard.sourceWidth = 800;
        } else if (exportParam.scale === 6) {
          standard.sourceHeight = 800;
          standard.sourceWidth = 900;
        } else if (exportParam.scale === 7) {
          standard.sourceHeight = 900;
          standard.sourceWidth = 1000;
        }
      } else if (typeof exportParam.width !== 'undefined' && typeof exportParam.height !== 'undefined') {
        standard.sourceHeight = exportParam.height;
        standard.sourceWidth = exportParam.width;
      }
    } else {
      standard.filename = `${standard.filename}_${this.getCurrentDate()}`;
    }
    return standard;
  }

  // Util
  private validateSeries(updateOption, isSubtitle = false) {
    try {
      const subtitle: any = { text: this.i18nNoDataAvailable };
      let xAxis = false;
      let yAxis = false;
      let zAxis = false;
      let navigator = false;
      let rangeSelector = false;

      // Declare Empty Object
      if (!updateOption.hasOwnProperty('rangeSelector')) {
        updateOption.rangeSelector = {};
      }

      if (!updateOption.hasOwnProperty('navigator')) {
        updateOption.navigator = {};
      }

      if (this.data.length !== 0) {
        xAxis = true;
        yAxis = true;
        zAxis = true;
        rangeSelector = true;
        navigator = true;
        subtitle.text = null;
      }

      if (this.isStock) {
        if (typeof this.rangeSelector !== 'undefined') {
          if (this.rangeSelector.hasOwnProperty('enabled')) {
            updateOption.rangeSelector.enabled = this.rangeSelector['enabled'];
          } else {
            updateOption.rangeSelector.enabled = rangeSelector;
          }
        } else {
          updateOption.rangeSelector.enabled = rangeSelector;
        }

        if (typeof this.navigator !== 'undefined') {
          if (this.navigator.hasOwnProperty('enabled')) {
            updateOption.navigator.enabled = this.navigator['enabled'];
          } else {
            updateOption.navigator.enabled = navigator;
          }
        } else {
          updateOption.navigator.enabled = navigator;
        }
      }

      if (typeof this.xAxis !== 'undefined') {
        this.complexOptionAssignment(updateOption, 'xAxis', { visible: xAxis });
      }

      if (typeof this.yAxis !== 'undefined') {
        this.complexOptionAssignment(updateOption, 'yAxis', { visible: yAxis });
      }

      if (typeof this.zAxis !== 'undefined') {
        this.complexOptionAssignment(updateOption, 'zAxis', { visible: zAxis });
      }

      if (!isSubtitle) {
        updateOption.subtitle = subtitle;
      }
    } catch (e) {
      console.log('Validate Series Error: ', e);
      if (this.globalPXH.debug) {
        console.log(`---${this.type}#${this.id}---`);
        console.log(e);
      }
    }
  }

  private complexOptionAssignment(updateOption, pixieKey, option) {
    let isArray = false;
    let currentArray;

    if (Array.isArray(this[pixieKey])) {
      isArray = true;
      currentArray = this[pixieKey];
    } else {
      currentArray = [this[pixieKey]];
    }

    if (!updateOption.hasOwnProperty(pixieKey)) {
      if (isArray) {
        updateOption[pixieKey] = [];
      } else {
        updateOption[pixieKey] = {};
      }
    }

    currentArray.forEach((d, i) => {
      const obj = {};
      if (isArray) {
        this.arrayObjectAssignment(obj, option);
        updateOption[pixieKey][i] = deepAssign({}, updateOption[pixieKey][i], obj);
      } else {
        this.arrayObjectAssignment(obj, option);
        updateOption[pixieKey] = deepAssign({}, updateOption[pixieKey], obj);
      }
    });
  }

  private arrayObjectAssignment(obj, option) {
    for (const key of Object.keys(option)) {
      const value = option[key];
      if (typeof value === 'object') {
        obj[key] = {};
        this.arrayObjectAssignment(obj[key], value);
      } else {
        obj[key] = value;
      }
    }
  }

  private declareGlobalPXH() {
    this.globalPXH = {};
    this.globalPXH.standardTooltipDesign = config.standardTooltipDesign;
    this.globalPXH.dateTimeLabelFormats = config.dateTimeLabelFormats;
    this.globalPXH.url = config.url;
    this.globalPXH.filename = config.filename;
    this.globalPXH.exportTheme = config.exportTheme;
    this.globalPXH.sameLegendSymbol = config.sameLegendSymbol;
    this.globalPXH.legendPosition = config.legendPosition;
    this.globalPXH.debug = config.debug;
    this.globalPXH.debugStringify = config.debugStringify;
  }

  private generateID() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < 5; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

  private getCurrentDate() {
    const date = new Date();
    const year = `0000${date.getFullYear()}`;
    const month = `0${date.getMonth() + 1}`;
    const day = `0${date.getDate()}`;
    const today = `${year.substr(-4)}_${month.substr(-2)}_${day.substr(-2)}`;
    return `_${today}`;
  }
}

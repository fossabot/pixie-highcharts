import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighchartsChartModule } from 'highcharts-angular';

import { LocaleService } from './pixie-highcharts/lib/locale.service';
import { HighchartsStatic } from './pixie-highcharts/lib/highcharts.service';

import { PixieHighChartsComponent } from './pixie-highcharts/pixie-highcharts.component';
import { ChartSeriesComponent } from './pixie-highcharts/lib/chart-series.component';
import { ChartPointComponent } from './pixie-highcharts/lib/chart-point.component';
import { ChartXAxisComponent } from './pixie-highcharts/lib/chart-xAxis.component';
import { ChartYAxisComponent } from './pixie-highcharts/lib/chart-yAxis.component';
import { ChartZAxisComponent } from './pixie-highcharts/lib/chart-zAxis.component';
import { ChartColorAxisComponent } from './pixie-highcharts/lib/chart-colorAxis.component';
import { ChartNavigationComponent } from './pixie-highcharts/lib/chart-navigation.component';

import { prefixConversion } from './pixie-highcharts/lib/prefixConversion';

const ChartDeclaration: any[] = [
  ChartSeriesComponent,
  ChartPointComponent,
  ChartXAxisComponent,
  ChartYAxisComponent,
  ChartZAxisComponent,
  ChartColorAxisComponent,
  ChartNavigationComponent
];

@NgModule({
  imports: [CommonModule, HighchartsChartModule],
  declarations: [PixieHighChartsComponent, ChartDeclaration],
  exports: [PixieHighChartsComponent, ChartDeclaration],
  providers: [LocaleService, HighchartsStatic]
})
export class PixieHighchartsModule {
  public static forRoot(highchartsStatic: HighchartsStatic, ...highchartsModules: Array<Function>): ModuleWithProviders {
    highchartsModules.forEach(module => {
      module(highchartsStatic);
    });

    return {
      ngModule: PixieHighchartsModule,
      providers: [{ provide: HighchartsStatic, useValue: highchartsStatic }]
    };
  }
}

export {
  PixieHighChartsComponent,
  ChartSeriesComponent,
  ChartPointComponent,
  ChartXAxisComponent,
  ChartYAxisComponent,
  ChartZAxisComponent,
  ChartColorAxisComponent,
  ChartNavigationComponent,
  prefixConversion
};

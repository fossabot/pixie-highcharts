import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PixieHighChartsComponent } from './pixie-highcharts.component';
import { HighchartsChartModule } from 'highcharts-angular';
import { HighchartsService, HighchartsStatic } from './lib/highcharts.service';

describe('PixieHighChartsComponent', () => {
  let component: PixieHighChartsComponent;
  let fixture: ComponentFixture<PixieHighChartsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PixieHighChartsComponent],
      imports: [HighchartsChartModule],
      providers: [HighchartsService]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PixieHighChartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

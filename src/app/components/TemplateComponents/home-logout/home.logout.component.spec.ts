import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeComponentLogout } from './home.logout.component';

describe('HomeComponentLogout', () => {
  let component: HomeComponentLogout;
  let fixture: ComponentFixture<HomeComponentLogout>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HomeComponentLogout]
    });
    fixture = TestBed.createComponent(HomeComponentLogout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

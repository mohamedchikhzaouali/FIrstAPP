import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeComponentLogin } from './home.login.component';

describe('HomeComponentLogin', () => {
  let component: HomeComponentLogin;
  let fixture: ComponentFixture<HomeComponentLogin>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HomeComponentLogin]
    });
    fixture = TestBed.createComponent(HomeComponentLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

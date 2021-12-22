import { TestBed } from '@angular/core/testing';

import { NordpoolService } from './nordpool.service';

describe('NordpoolService', () => {
  let service: NordpoolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NordpoolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

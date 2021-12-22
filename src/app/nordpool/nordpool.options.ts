export interface INordpoolOptions {
    fillDate: Number,
    minDate: Date | undefined,
    maxDate: Date | undefined
}

export interface INordpoolResult {
    current: any,
    values: any,
    minDate: Date,
    maxDate: Date,
    options: INordpoolOptions,
    ranges: INordpoolRange[]
}

export interface INordpoolRangeValue {
    startDate: Date | undefined,
    endDate: Date | undefined
}

export interface INordpoolRange {
    value: INordpoolRangeValue;
    viewValue: string;
}

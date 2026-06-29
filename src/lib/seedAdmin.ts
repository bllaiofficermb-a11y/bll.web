export const EMPLOYEE_PASSWORD_SUFFIX = '#bll'

export const toAuthPassword = (pin: string) => `${pin.trim()}${EMPLOYEE_PASSWORD_SUFFIX}`

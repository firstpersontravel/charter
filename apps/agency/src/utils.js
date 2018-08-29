export function getStage() {
  if (window.location.host.indexOf('staging.firstperson.travel') > -1) {
    return 'staging';
  }
  if (window.location.host.indexOf('firstperson.travel') > -1) {
    return 'production';
  }
  return 'development';
}

export function isProduction() {
  return getStage() === 'production';
}

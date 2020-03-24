function fmtLocal(time) {
  if (!time) {
    return '<null time>';
  }
  return time.clone().tz('US/Pacific').format('MMM DD, h:mm:ssa z');
}

module.exports = {
  fmtLocal: fmtLocal
};

const FptCore = require('fptcore').default;

export function typeTitleForSpec(spec) {
  if (FptCore.Validations[spec.type] && FptCore.Validations[spec.type].title) {
    return FptCore.Validations[spec.type].title;
  }
  return FptCore.TextUtil.titleForKey(spec.type);
}

export function labelForSpec(spec, key) {
  return FptCore.TextUtil.titleForSpec(spec, key);
}

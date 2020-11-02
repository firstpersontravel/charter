import { TextUtil, Validations } from 'fptcore';

export function typeTitleForSpec(spec) {
  if (Validations[spec.type] && Validations[spec.type].title) {
    return Validations[spec.type].title;
  }
  return TextUtil.titleForKey(spec.type);
}

export function labelForSpec(spec, key) {
  return TextUtil.titleForSpec(spec, key);
}

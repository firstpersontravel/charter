import ChoiceComponent from './choice';

export default ChoiceComponent.extend({
  classNames: ['page-panel-yesno', 'page-panel-padded'],

  layoutName: 'components/page-panels/choice',

  choices: [
    {text: 'Yes', value_ref: 'true'},
    {text: 'No', value_ref: 'false'}
  ]
});

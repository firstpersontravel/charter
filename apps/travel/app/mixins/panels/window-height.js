import Ember from 'ember';
import $ from 'jquery';

export default Ember.Mixin.create({

  contentEl: null,
  footerEl: null,
  maxHeight: 1500,

  didInsertElement: function() {
    this.onResize();
    this._super();
    this._resizeHandler = this.onResize.bind(this);
    $(window).on('resize', this._resizeHandler);
  },

  willRemoveElement: function() {
    $(window).off('resize', this._resizeHandler);
    this._resizeHandler = null;
  },

  onResize: function() {
    var contentEl = this.get('contentEl');
    var footerEl = this.get('footerEl');

    if (contentEl === null) { return; }
    var $contentEl = (contentEl === '') ? this.$() : this.$(contentEl);
    if (!$contentEl || !$contentEl.length) { return; }

    var $footerEl = $(footerEl);
    var windowHeight = $(window).height();
    if (windowHeight > this.get('maxHeight')) { return; }
    var paddingBottom = (footerEl && $footerEl.length > 0) ?
      $footerEl.outerHeight() : 0;
    $contentEl.each(function() {
      var $el = $(this);
      var elTop = $el.offset().top;
      var contentHeight = windowHeight - elTop - paddingBottom;
      $el.height(contentHeight);
    });
  }
});

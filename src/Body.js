"use strict";
var createWidgetBase_1 = require("@dojo/widget-core/createWidgetBase");
var registryMixin_1 = require("@dojo/widget-core/mixins/registryMixin");
var d_1 = require("@dojo/widget-core/d");
var createBody = createWidgetBase_1.default
    .mixin(registryMixin_1.default)
    .mixin({
    mixin: {
        render: function () {
            var _a = this.properties, items = _a.items, columns = _a.columns, registry = _a.registry;
            return d_1.v('div.dgrid-scroller', [
                d_1.v('div.dgrid-content', items.map(function (item) {
                    return d_1.w('row', {
                        key: item.id,
                        item: item,
                        columns: columns,
                        registry: registry
                    });
                }))
            ]);
        }
    }
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createBody;

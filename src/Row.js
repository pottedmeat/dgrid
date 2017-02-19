"use strict";
var createWidgetBase_1 = require("@dojo/widget-core/createWidgetBase");
var registryMixin_1 = require("@dojo/widget-core/mixins/registryMixin");
var d_1 = require("@dojo/widget-core/d");
var createRow = createWidgetBase_1.default
    .mixin(registryMixin_1.default)
    .mixin({
    mixin: {
        render: function () {
            var _a = this.properties, registry = _a.registry, item = _a.item, _b = _a.columns, columns = _b === void 0 ? [] : _b;
            return d_1.v('div.dgrid-row', {
                role: 'row'
            }, [
                d_1.v('table.dgrid-row-table', {
                    role: 'presentation'
                }, [
                    d_1.v('tr', columns.map(function (_a) {
                        var id = _a.id, field = _a.field, renderer = _a.renderer;
                        return d_1.w('cell', {
                            registry: registry,
                            key: id,
                            item: item,
                            data: item.data[field || id],
                            renderer: renderer
                        });
                    }))
                ])
            ]);
        }
    }
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createRow;

"use strict";
var createWidgetBase_1 = require("@dojo/widget-core/createWidgetBase");
var d_1 = require("@dojo/widget-core/d");
var createCell = createWidgetBase_1.default
    .mixin({
    mixin: {
        render: function () {
            var _a = this.properties, item = _a.item, _b = _a.data, data = _b === void 0 ? '' : _b, renderer = _a.renderer;
            return d_1.v('td.dgrid-cell', {
                role: 'gridcell'
            }, [
                renderer ? renderer(item, data) : '' + data
            ]);
        }
    }
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createCell;

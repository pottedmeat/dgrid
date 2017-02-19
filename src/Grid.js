"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var WidgetBase_1 = require("@dojo/widget-core/WidgetBase");
var d_1 = require("@dojo/widget-core/d");
var FactoryRegistry_1 = require("@dojo/widget-core/FactoryRegistry");
var Header_1 = require("./Header");
var HeaderCell_1 = require("./HeaderCell");
var Body_1 = require("./Body");
var Row_1 = require("./Row");
var Cell_1 = require("./Cell");
var Grid = (function (_super) {
    __extends(Grid, _super);
    function Grid(properties) {
        var _this = _super.call(this, properties) || this;
        var dataProvider = properties.dataProvider;
        var registry = _this.registry = new FactoryRegistry_1.default();
        registry.define('header', Header_1.default);
        registry.define('header-cell', HeaderCell_1.default);
        registry.define('body', Body_1.default);
        registry.define('row', Row_1.default);
        registry.define('cell', Cell_1.default);
        if (dataProvider) {
            dataProvider.observe().subscribe(function (data) {
                _this.data = data;
                _this.invalidate();
            });
        }
        return _this;
    }
    Grid.prototype.render = function () {
        var _a = this, registry = _a.registry, _b = _a.data, items = _b.items, sort = _b.sort, _c = _a.properties, columns = _c.columns, dataProvider = _c.dataProvider;
        var onSort = dataProvider.sort;
        return d_1.v('div.dgrid.dgrid-grid', {
            role: 'grid'
        }, [
            d_1.w('header', {
                registry: registry,
                columns: columns,
                sort: sort,
                onSort: onSort && onSort.bind(dataProvider)
            }),
            d_1.w('body', {
                registry: registry,
                columns: columns,
                items: items
            })
        ]);
    };
    return Grid;
}(WidgetBase_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Grid;

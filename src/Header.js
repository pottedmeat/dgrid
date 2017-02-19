"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var WidgetBase_1 = require("@dojo/widget-core/WidgetBase");
var Registry_1 = require("@dojo/widget-core/mixins/Registry");
var d_1 = require("@dojo/widget-core/d");
var Header = (function (_super) {
    __extends(Header, _super);
    function Header() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Header;
}(Registry_1.default(WidgetBase_1.default)));
var createHeader = createWidgetBase
    .mixin(registryMixin)
    .mixin({
    mixin: {
        render: function () {
            var _a = this.properties, onSortRequest = _a.onSortRequest, columns = _a.columns, _b = _a.sortDetails, sortDetails = _b === void 0 ? [] : _b;
            return d_1.v('div.dgrid-header.dgrid-header-row', {
                role: 'row'
            }, [
                d_1.v('table.dgrid-row-table', {
                    role: 'presentation'
                }, [
                    d_1.v('tr', columns.map(function (column) {
                        var sortDetail = undefined;
                        for (var _i = 0, sortDetails_1 = sortDetails; _i < sortDetails_1.length; _i++) {
                            var detail = sortDetails_1[_i];
                            if (detail.columnId === column.id) {
                                sortDetail = detail;
                                break;
                            }
                        }
                        return d_1.w('header-cell', {
                            key: column.id,
                            column: column,
                            sortDetail: sortDetail,
                            onSortRequest: onSortRequest
                        });
                    }))
                ])
            ]);
        }
    }
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createHeader;

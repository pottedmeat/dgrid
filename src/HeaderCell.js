"use strict";
var createWidgetBase_1 = require("@dojo/widget-core/createWidgetBase");
var registryMixin_1 = require("@dojo/widget-core/mixins/registryMixin");
var d_1 = require("@dojo/widget-core/d");
var createHeaderCell = createWidgetBase_1.default
    .mixin(registryMixin_1.default)
    .mixin({
    mixin: {
        onSortRequest: function () {
            var _a = this.properties, key = _a.key, column = _a.column, sortDetail = _a.sortDetail, onSortRequest = _a.onSortRequest;
            if (onSortRequest && (column.sortable || !column.hasOwnProperty('sortable'))) {
                onSortRequest({
                    columnId: key,
                    descending: !!(sortDetail && sortDetail.columnId === key && !sortDetail.descending)
                });
            }
        },
        render: function () {
            var _a = this.properties, key = _a.key, column = _a.column, sortDetail = _a.sortDetail;
            return d_1.v('th.dgrid-cell', {
                role: 'columnheader',
                onclick: this.onSortRequest,
                classes: {
                    'dgrid-sort-up': Boolean(sortDetail && !sortDetail.descending),
                    'dgrid-sort-down': Boolean(sortDetail && sortDetail.descending)
                }
            }, [
                d_1.v('span', [column.label || column.id]),
                sortDetail && sortDetail.columnId === key ? d_1.v('div.dgrid-sort-arrow.ui-icon', { role: 'presentation' }) : null
            ]);
        }
    }
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createHeaderCell;

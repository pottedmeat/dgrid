import { v, w } from '@dojo/widget-core/d';
import { RegistryMixin, RegistryMixinProperties }  from '@dojo/widget-core/mixins/Registry';
import { ThemeableMixin, theme, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import { HeaderCellProperties } from './HeaderCell';
import { HasColumns, HasSortDetails, HasSortEvent } from './interfaces';

import * as headerClasses from './styles/header.css';

export const HeaderBase = ThemeableMixin(RegistryMixin(WidgetBase));

export interface HeaderProperties extends ThemeableProperties, HasColumns, HasSortDetails, HasSortEvent, RegistryMixinProperties { }

@theme(headerClasses)
class Header extends HeaderBase<HeaderProperties> {
	render() {
		const {
			onSortRequest,
			columns,
			sortDetails = [],
			registry,
			theme
		} = this.properties;

		return v('div', {
			classes: this.classes(headerClasses.header, headerClasses.row),
			role: 'row'
		}, [
			v('table', {
				role: 'presentation',
				classes: this.classes(headerClasses.rowTable)
			}, [
				v('tr', columns.map((column) => {
					let sortDetail;
					for (const detail of sortDetails) {
						if (detail.columnId === column.id) {
							sortDetail = detail;
							break;
						}
					}

					return w('header-cell', <HeaderCellProperties> {
						key: column.id,
						column,
						sortDetail,
						onSortRequest,
						registry,
						theme
					});
				}))
			])
		]);
	}
}

export default Header;

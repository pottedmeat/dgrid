import WidgetBase from '@dojo/widget-core/WidgetBase';
import { RegistryMixin, RegistryMixinProperties }  from '@dojo/widget-core/mixins/Registry';
import { v, w } from '@dojo/widget-core/d';
import { WidgetProperties } from '@dojo/widget-core/interfaces';
import { HasColumns, HasSortDetails, HasSortEvent } from './interfaces';
import { HeaderCellProperties } from './HeaderCell';
import { ThemeableMixin, theme } from '@dojo/widget-core/mixins/Themeable';

import * as headerClasses from './styles/header.css';

export interface HeaderProperties extends WidgetProperties, HasColumns, HasSortDetails, HasSortEvent, RegistryMixinProperties { }

@theme(headerClasses)
class Header extends ThemeableMixin(RegistryMixin(WidgetBase))<HeaderProperties> {
	render() {
		const {
			onSortRequest,
			columns,
			sortDetails = []
		} = this.properties;

		return v('div', {
			classes: this.classes(headerClasses.header, headerClasses.row).get(),
			role: 'row'
		}, [
			v('table', {
				role: 'presentation',
				classes: this.classes(headerClasses.rowTable).get()
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
						onSortRequest
					});
				}))
			])
		]);
	}
}

export default Header;

import { from } from '@dojo/shim/array';
import Map from '@dojo/shim/Map';
import { v, w } from '@dojo/widget-core/d';
import { DNode } from '@dojo/widget-core/interfaces';
import { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import { diff } from './compare';
import { HasColumns, HasItems, HasSliceEvent, HasOffset, HasTotalLength, ItemProperties } from './interfaces';
import { RowProperties } from './Row';
import { ThemeableMixin, theme, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';

import * as bodyClasses from './styles/body.css';

interface RenderedDetails {
	element?: HTMLElement;
	height?: number;
	add: boolean;
	delete: boolean;
}

export const BodyBase = ThemeableMixin(RegistryMixin(WidgetBase));

export interface BodyProperties extends ThemeableProperties, HasColumns, HasItems, HasOffset, HasTotalLength, HasSliceEvent, RegistryMixinProperties { }

@theme(bodyClasses)
class Body extends BodyBase<BodyProperties> {
	private itemElementMap = new Map<string, RenderedDetails>();
	private scroller: HTMLElement;
	private scrollTop = 0;
	private firstVisibleKey: string;

	private visibleKeys() {
		// find the first visible row
		const {
			itemElementMap
		} = this;
		const scroll = this.scroller.scrollTop;
		const contentHeight = this.scroller.offsetHeight;
		const visible: string[] = [];
		for (const [ key, renderedDetails ] of from(itemElementMap.entries())) {
			const element = renderedDetails.element;
			if (element) {
				const top = element.offsetTop;
				const height = element.offsetHeight;
				if ((top + height) >= scroll && top < (scroll + contentHeight)) {
					visible.push(key);
				}
				else if (visible.length) {
					break;
				}
			}
		}
		return visible;
	}

	protected onScroll(event: UIEvent) {
		const {
			properties: {
				items,
				offset,
				totalLength,
				onSliceRequest
			}
		} = this;

		this.scrollTop = this.scroller.scrollTop;

		const visibleKeys = this.visibleKeys();
		if (visibleKeys.length > 0) {
			// Remember the first visible key
			this.firstVisibleKey = visibleKeys[0];

			// Request new content
			let before = 0;
			for (let i = 0, item; (item = items[i]); i++) {
				const key = String(item.id);
				if (visibleKeys[0] === key) {
					before = i;
					break;
				}
			}

			// 100 before and after
			const start = Math.max(0, offset - 100 + before);
			let count = (Math.min(before, 100) + visibleKeys.length + 100);
			if (start + count > totalLength) {
				count = (totalLength - start);
			}

			if (Math.abs(start - offset) > 10 || Math.abs(count - items.length) > 10) {
				// TODO: Throttle?
				console.log('slice', start, count);
				onSliceRequest && onSliceRequest({ start, count });
			}
		}
	}

	protected onElementChange(element: HTMLElement, key: string): void {
		const renderedDetails = this.itemElementMap.get(key);
		if (renderedDetails) {
			renderedDetails.element = element;
		}
	}

	protected onElementCreated(element: HTMLElement, key: 'scroller'): void {
		if (key === 'scroller') {
			this.scroller = element;

			for (const [ itemKey, renderedDetails ] of from(this.itemElementMap.entries())) {
				renderedDetails.add = false;
			}

			return;
		}
		this.onElementChange(element, key);
	}

	protected onElementUpdated(element: HTMLElement, key: 'scroller'): void {
		if (key === 'scroller') {
			const {
				firstVisibleKey,
				itemElementMap,
				scroller
			} = this;

			let scrollTop = this.scrollTop;
			let beforeVisible = true;
			for (const [ itemKey, renderedDetails ] of from(itemElementMap.entries())) {
				if (itemKey === firstVisibleKey) {
					beforeVisible = false;
				}

				if (beforeVisible) {
					if (renderedDetails.add && renderedDetails.element) {
						scrollTop += renderedDetails.element.offsetHeight;
					}
					if (renderedDetails.delete) {
						scrollTop -= (renderedDetails.height || 0);
					}
				}

				renderedDetails.add = false;
				if (renderedDetails.delete) {
					itemElementMap.delete(itemKey);
				}
			}

			scroller.scrollTop = scrollTop;

			return;
		}
		this.onElementChange(element, key);
	}

	createNodeFromItem(item: ItemProperties<any>) {
		const {
			itemElementMap,
			properties: {
				columns,
				registry,
				theme
			}
		} = this;

		const key = item.id;
		let renderedDetails = itemElementMap.get(key);
		if (!renderedDetails) {
			renderedDetails = {
				add: true,
				delete: false
			};
			itemElementMap.set(key, renderedDetails);
		}

		return v('div', {
			key,
			role: 'row',
			classes: this.classes(bodyClasses.row)
		}, [
			w<RowProperties>('row', {
				key,
				item,
				columns,
				registry,
				theme
			})
		]);
	}

	render() {
		const {
			itemElementMap,
			properties: {
				items
			}
		} = this;

		const children: DNode[] = [];

		const previousKeys = from(itemElementMap.keys());
		if (previousKeys.length === 0) {
			// TODO: Split when properties contain an offset
			for (const item of items) {
				children.push(this.createNodeFromItem(item));
			}
		}
		else {
			const updatedItemElementMap = new Map<string, RenderedDetails>();

			const itemsByKey: { [key: string]: ItemProperties<any> } = {};
			const currentKeys: string[] = items.map((item) => {
				const key = item.id;
				itemsByKey[key] = item;
				return key;
			});

			const keyPatches = diff(currentKeys, previousKeys);
			for (let i = 0, il = previousKeys.length; i <= il; i++) {
				const key = previousKeys[i];

				const keyPatch = keyPatches[i];
				if (keyPatch) {
					if (keyPatch.added) {
						for (const added of keyPatch.added) {
							const key = currentKeys[added.to];
							children.push(this.createNodeFromItem(itemsByKey[key]));

							const updatedMeasured = itemElementMap.get(key);
							if (updatedMeasured) {
								updatedItemElementMap.set(key, updatedMeasured);
							}
						}
					}
				}

				if (i < il) {
					const item = itemsByKey[key];
					const renderedDetails = itemElementMap.get(key);
					if (item) {
						children.push(this.createNodeFromItem(item));

						const updatedMeasured = itemElementMap.get(key);
						if (updatedMeasured) {
							updatedItemElementMap.set(key, updatedMeasured);
						}
					}
					else {
						// this item no longer appears in current data
						if (renderedDetails) {
							if (!renderedDetails.delete && renderedDetails.element) {
								renderedDetails.height = renderedDetails.element.offsetHeight;
							}
							renderedDetails.delete = true;

							const updatedMeasured = itemElementMap.get(key);
							if (updatedMeasured) {
								updatedItemElementMap.set(key, updatedMeasured);
							}
						}
					}
				}
			}

			this.itemElementMap = updatedItemElementMap;
		}

		return v('div', {
				key: 'scroller',
				classes: this.classes(bodyClasses.scroller),
				onscroll: this.onScroll
			},
			children
		);
	}
}

export default Body;

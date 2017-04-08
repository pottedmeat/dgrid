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
	add: boolean;
	delete: boolean;
	element?: HTMLElement;
	index: number;
	height?: number;
}

export const BodyBase = ThemeableMixin(RegistryMixin(WidgetBase));

export interface BodyProperties extends ThemeableProperties, HasColumns, HasItems, HasOffset, HasTotalLength, HasSliceEvent, RegistryMixinProperties { }

const margin = 10000;
const preload = 100;
const drift = 25;

@theme(bodyClasses)
class Body extends BodyBase<BodyProperties> {
	private itemElementMap = new Map<string, RenderedDetails>();
	private scroller: HTMLElement;
	private scrollTop = 0;
	private marginTop: RenderedDetails;
	private firstVisibleKey: string;

	private visibleKeys() {
		// TODO: Use the intersection observer API
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
			itemElementMap,
			properties: {
				items,
				totalLength,
				offset,
				onSliceRequest
			}
		} = this;

		this.scrollTop = this.scroller.scrollTop;

		const visibleKeys = this.visibleKeys();
		if (visibleKeys.length === 0) {
			// scrolled too fast
			console.log('scrolled past all loaded rows');
			const keys = from(itemElementMap.keys());
			const renderedDetails = itemElementMap.get(keys[preload]); // the intended top-of-viewport item
			if (renderedDetails && renderedDetails.element) {
				this.scroller.scrollTop = renderedDetails.element.offsetTop;
			}

			// TODO: Estimate what row they scrolled to
			// and reload from scratch
		}
		else {
			// Remember the first visible key
			this.firstVisibleKey = visibleKeys[ 0 ];
			const renderedDetails = itemElementMap.get(this.firstVisibleKey);
			if (renderedDetails) {
				// Request new content
				// preload before and after
				const start = Math.max(0, renderedDetails.index - preload);
				let count = (Math.min(renderedDetails.index, preload) + visibleKeys.length + preload);
				if (start + count > totalLength) {
					count = (totalLength - start);
				}

				// check to see if the data we need to load is
				// different enough from what we already have
				if (start === 0 || Math.abs(start - offset) > drift || Math.abs(count - items.length) > drift || (start + count) === items.length) {
					// TODO: Throttle?
					console.log('slice', start, count);
					onSliceRequest && onSliceRequest({ start, count });
				}
			}
		}
	}

	protected onElementChange(element: HTMLElement, key: string): void {
		if (key === 'marginTop') {
			if (this.marginTop) {
				this.marginTop.element = element;
			}
			return;
		}

		if (key === 'marginBottom') {
			return;
		}

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

			const marginTop = this.marginTop;
			if (marginTop) {
				if (marginTop.add && marginTop.element) {
					scrollTop += marginTop.element.offsetHeight;
					marginTop.add = false;
				}
				if (marginTop.delete) {
					scrollTop -= (marginTop.height || 0);
					delete this.marginTop;
				}
			}

			scroller.scrollTop = scrollTop;

			return;
		}
		this.onElementChange(element, key);
	}

	createNodeFromItem(item: ItemProperties<any>, index: number) {
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
				delete: false,
				index: index
			};
			itemElementMap.set(key, renderedDetails);
		}
		else {
			renderedDetails.index = index;
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
				items,
				offset,
				totalLength
			}
		} = this;

		const children: DNode[] = [];

		const previousKeys = from(itemElementMap.keys());
		if (previousKeys.length === 0) {
			// TODO: Split when properties contain an offset
			for (let i = 0, item; (item = items[i]); i++) {
				children.push(this.createNodeFromItem(item, i));
			}
		}
		else {
			const updatedItemElementMap = new Map<string, RenderedDetails>();

			const itemsByKey: { [key: string]: DNode } = {};
			const currentKeys: string[] = items.map((item, index) => {
				const key = item.id;
				itemsByKey[key] = this.createNodeFromItem(item, (offset + index));
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
							children.push(itemsByKey[key]);

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
						children.push(item);

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

		let marginTop = this.marginTop;
		if (offset > 0) {
			if (!marginTop) {
				marginTop = this.marginTop = {
					add: true,
					delete: false,
					index: -1
				};
			}
			children.unshift(v('div', {
				key: 'marginTop',
				styles: {
					height: (margin + 'px')
				}
			}));
		}
		else if (marginTop) {
			if (marginTop.element) {
				marginTop.height = marginTop.element.offsetHeight;
			}
			marginTop.delete = true;
		}

		if (offset + items.length + 1 < totalLength) {
			children.push(v('div', {
				key: 'marginBottom',
				styles: {
					height: (margin + 'px')
				}
			}));
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

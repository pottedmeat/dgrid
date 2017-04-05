import { from, includes } from '@dojo/shim/array';
import Map from '@dojo/shim/Map';
import { v, w } from '@dojo/widget-core/d';
import { DNode } from '@dojo/widget-core/interfaces';
import { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import { diff } from './compare';
import { HasColumns, HasItems, HasRangeEvent, HasOffset, HasTotalLength, ItemProperties } from './interfaces';
import { RowProperties } from './Row';
import { ThemeableMixin, theme, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';

import * as bodyClasses from './styles/body.css';

type Sections = 'top' | 'bottom';

interface RenderedDetails {
	element?: HTMLElement;
	height?: number;
	section: Sections;
	add: boolean;
	delete: boolean;
}

export const BodyBase = ThemeableMixin(RegistryMixin(WidgetBase));

export interface BodyProperties extends ThemeableProperties, HasColumns, HasItems, HasOffset, HasTotalLength, HasRangeEvent, RegistryMixinProperties { }

@theme(bodyClasses)
class Body extends BodyBase<BodyProperties> {
	private itemElementMap = new Map<string, RenderedDetails>();
	private scroller: HTMLElement;
	private scrollTop = 0;
	private firstVisibleKey: string;
	private top: HTMLElement;
	private bottom: HTMLElement;

	private visibleKeys() {
		// find the first visible row
		const {
			itemElementMap,
			properties: {
				items
			}
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
				offset,
				totalLength,
				onRangeRequest
			}
		} = this;

		this.scrollTop = this.scroller.scrollTop;

		const visibleKeys = this.visibleKeys();
		if (visibleKeys.length > 0) {
			// Reposition rows
			this.firstVisibleKey = visibleKeys[0];
			const currentKeys: string[] = items.map((item) => {
				return item.id;
			});
			const firstVisibleKey = visibleKeys[0];
			let beforeVisible = true;
			let section: Sections = 'top';
			const firstBottomKey = currentKeys[Math.max(0, currentKeys.indexOf(visibleKeys[0]) - 5)];
			for (const [ previousKey, renderedDetails ] of from(itemElementMap.entries())) {
				if (previousKey === firstVisibleKey) {
					beforeVisible = false;
				}
				if (previousKey === firstBottomKey) {
					section = 'bottom';
				}

				const element = renderedDetails.element;
				if (element) {
					if (section === 'bottom') {
						if (renderedDetails.section === 'top') {
							// Move from top to bottom
							// this.bottom.insertBefore(element, this.bottom.firstChild);
							renderedDetails.section = section;
						}
						else if (renderedDetails.section === 'bottom') {
							break;
						}
					}
					else if (section === 'top' && renderedDetails.section === 'bottom') {
						// Move from bottom to top
						// this.top.appendChild(element);
						renderedDetails.section = section;
					}
				}
			}

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
				console.log('range', start, count);
				onRangeRequest && onRangeRequest({ start, count });
			}
		}
	}

	protected onElementChange(element: HTMLElement, key: string): void {
		const renderedDetails = this.itemElementMap.get(key);
		if (renderedDetails) {
			renderedDetails.element = element;
		}
	}

	protected onElementCreated(element: HTMLElement, key: Sections | 'scroller'): void {
		if (key === 'top') {
			this.top = element;
			return;
		}
		if (key === 'bottom') {
			this.bottom = element;
			return;
		}
		if (key === 'scroller') {
			this.scroller = element;

			for (const [ itemKey, renderedDetails ] of from(this.itemElementMap.entries())) {
				renderedDetails.add = false;
			}

			return;
		}
		this.onElementChange(element, key);
	}

	protected onElementUpdated(element: HTMLElement, key: Sections | 'scroller'): void {
		if (key === 'top' || key === 'bottom') {
			return;
		}
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
						itemElementMap.delete(itemKey);
						scrollTop -= (renderedDetails.height || 0);
					}
				}

				renderedDetails.add = false;
			}

			scroller.scrollTop = scrollTop;

			return;
		}
		this.onElementChange(element, key);
	}

	createNodeFromItem(item: ItemProperties<any>, section: Sections) {
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
				section,
				add: true,
				delete: false
			};
			itemElementMap.set(key, renderedDetails);
		}
		else {
			renderedDetails.section = section;
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

		const sections = {
			top: <DNode[]> [],
			bottom: <DNode[]> []
		};

		const previousKeys = from(itemElementMap.keys());
		if (previousKeys.length === 0) {
			// TODO: Split when properties contain an offset
			for (const item of items) {
				sections.bottom.push(this.createNodeFromItem(item, 'bottom'));
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
			let section: Sections = 'top';
			for (let i = 0, il = previousKeys.length; i <= il; i++) {
				const key = previousKeys[i];

				const keyPatch = keyPatches[i];
				if (keyPatch) {
					if (keyPatch.added) {
						for (const added of keyPatch.added) {
							const key = currentKeys[added.to];
							sections[section].push(this.createNodeFromItem(itemsByKey[key], section));

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
						sections[section].push(this.createNodeFromItem(item, section));

						const updatedMeasured = itemElementMap.get(key);
						if (updatedMeasured) {
							updatedItemElementMap.set(key, updatedMeasured);
						}
					}
					else {
						// this item no longer appears in current data
						if (renderedDetails) {
							renderedDetails.delete = true;
							if (renderedDetails.element) {
								renderedDetails.height = renderedDetails.element.offsetHeight;
							}

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
			[
				v('div', {
					key: 'top',
					classes: this.classes(bodyClasses.top)
				}, sections.top),
				v('div', {
					key: 'bottom',
					classes: this.classes(bodyClasses.bottom)
				}, sections.bottom)
			]
		);
	}
}

export default Body;

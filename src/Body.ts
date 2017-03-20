import { from } from '@dojo/shim/array';
import Map from '@dojo/shim/Map';
import Promise from '@dojo/shim/Promise';
import { v, w } from '@dojo/widget-core/d';
import { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';
import WidgetBase from '@dojo/widget-core/WidgetBase';
import { HasColumns, HasItems, HasRangeEvent, HasOffset, HasTotalLength } from './interfaces';
import { RowProperties } from './Row';
import { ThemeableMixin, theme, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';

import * as bodyClasses from './styles/body.css';

interface Measured {
	element: HTMLElement;
	height: number;
	promise?: Promise<HTMLElement>;
}

export interface BodyProperties extends ThemeableProperties, HasColumns, HasItems, HasOffset, HasTotalLength, HasRangeEvent, RegistryMixinProperties { }

@theme(bodyClasses)
class Body extends ThemeableMixin(RegistryMixin(WidgetBase))<BodyProperties> {
	private previousItemElementMap = new Map<string, Measured>();
	private currentItemElementMap = new Map<string, Measured>();
	private before: HTMLElement;
	private scroller: HTMLElement;
	private content: HTMLElement;
	private after: HTMLElement;
	private visible: string[] = [];

	private visibleKeys() {
		// find the first visible row
		const {
			items
		} = this.properties;
		const scroll = this.scroller.scrollTop;
		const contentHeight = this.scroller.offsetHeight;
		const visible: string[] = this.visible = [];
		for (let i = 0, item; (item = items[i]); i++) {
			const key = String(item.id);
			const measured = this.currentItemElementMap.get(key);
			if (measured) {
				const element = measured.element;
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
			items,
			offset,
			totalLength,
			onRangeRequest
		} = this.properties;

		const visible = this.visibleKeys();

		if (visible.length === 0) {
			// Completely reset when visible is empty (no overlap in data)
		}
		else {
			let before = 0;
			for (let i = 0, item; (item = items[i]); i++) {
				const key = String(item.id);
				if (visible[0] === key) {
					before = i;
					break;
				}
			}

			// 100 before and after
			const start = Math.max(0, offset - 100 + before);
			let count = (Math.min(before, 100) + visible.length + 100);
			if (start + count > totalLength) {
				count = (totalLength - start);
			}

			if (start !== offset || count !== items.length) {
				onRangeRequest && onRangeRequest({ start, count });
			}
		}
	}

	protected onElementChange(element: HTMLElement, key: string): void {
		if (key === 'scroller') {
			// There is a margin before and after the content that starts at 1000px in height.
			// As content is added and removed, these margins will adjust until they need to be reset

			this.scroller = element;

			return;

			const {
				previousItemElementMap,
				currentItemElementMap,
				properties: {
					items
				}
			} = this;

			const visibleKeys = this.visibleKeys();
			const previousKeys = from(previousItemElementMap.keys());
			const currentKeys = items.map((item) => { return String(item.id); });
			let removed = 0;
			let added = 0;
			for (const visibleKey of visibleKeys) {
				const overlap = currentKeys.indexOf(visibleKey);
				if (overlap !== -1) {
					// the first key in common between visible items and current items
					for (const previousKey of previousKeys) {
						if (previousKey === visibleKey) {
							break;
						}
						if (currentKeys.indexOf(previousKey) === -1) {
							const measured = previousItemElementMap.get(previousKey);
							if (measured) {
								removed += measured.height;
							}
						}
					}
					for (let i = 0; i < overlap; i++) {
						const currentKey = currentKeys[i];
						if (previousKeys.indexOf(currentKey) === -1) {
							const measured = currentItemElementMap.get(currentKey);
							if (measured) {
								added += measured.element.offsetHeight;
							}
						}
					}
					break;
				}
			}

			let beforeHeight = (this.before.clientHeight - added + removed);
			if (beforeHeight < 500) {
				// reset margins
				this.scroller.scrollTop -= (1000 - beforeHeight);
				beforeHeight = 1000;
			}
			else if (beforeHeight > 1500) {
				// reset margins
				this.scroller.scrollTop += (beforeHeight - 1000);
				beforeHeight = 1000;
			}
			this.before.style.height = beforeHeight + "px";
			this.after.style.height = (2000 - beforeHeight) + "px";

			const newItemElementMap = new Map<string, Measured>();
			for (const item of items) {
				const key = String(item.id);
				const measured = currentItemElementMap.get(key);
				if (measured) {
					newItemElementMap.set(key, measured);
				}
			}
			this.previousItemElementMap = currentItemElementMap;
			this.currentItemElementMap = newItemElementMap;

			return;
		}

		let measured = this.currentItemElementMap.get(key);
		if (!measured) {
			measured = {
				element,
				height: element.offsetHeight
			};
		}
		else {
			measured.element = element;
			measured.height = element.offsetHeight;
		}
		this.currentItemElementMap.set(key, measured);
	}

	protected onElementCreated(element: HTMLElement, key: string): void {
		if (key === 'before') {
			// element.style.height = "1000px";
			this.before = element;
			return;
		}
		if (key === 'content') {
			this.content = element;
			return;
		}
		if (key === 'after') {
			// element.style.height = "1000px";
			this.after = element;
			return;
		}
		this.onElementChange(element, key);
	}

	protected onElementUpdated(element: HTMLElement, key: string): void {
		this.onElementChange(element, key);
	}

	render() {
		const {
			items,
			columns,
			registry,
			theme
		} = this.properties;

		// I have the heights of previously rendered rows captured
		// I don't have the heights of new rows captured
		// I can create an all promise that resolves when I know all the new heights
		// that sets the margin height

		return v('div', {
				key: 'scroller',
				classes: this.classes(bodyClasses.scroller),
				onscroll: this.onScroll
			},
			[
				v('div', {
					key: 'content',
					classes: this.classes(bodyClasses.content)
				},
				[
					v('div', {
						key: 'before'
					}),
					...items.map((item) => {
						return v('div', {
							key: item.id,
							role: 'row',
							classes: this.classes(bodyClasses.row)
						}, [
							w('row', <RowProperties> {
								key: item.id,
								item,
								columns,
								registry,
								theme
							})
						]);
					}),
					v('div', {
						key: 'after'
					})
				])
			]
		);
	}
}

export default Body;

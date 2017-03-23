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
			// TODO: completely reset when visible is empty (no overlap in data)
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

			if (Math.abs(start - offset) > 25 || Math.abs(count - items.length) > 25) {
				onRangeRequest && onRangeRequest({ start, count });
			}
		}
	}

	protected onElementChange(element: HTMLElement, key: string): void {
		if (key === 'scroller') {
			this.scroller = element;

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
			let before = 0;
			let after = 0;
			for (const visibleKey of visibleKeys) {
				const overlap = currentKeys.indexOf(visibleKey);
				if (overlap !== -1) {
					// the first key in common between visible items and current items
					for (const previousKey of previousKeys) {
						if (previousKey === visibleKey) {
							break;
						}
						if (currentKeys.indexOf(previousKey) === -1) {
							// this node no longer exists
							const measured = previousItemElementMap.get(previousKey);
							if (measured) {
								before += measured.height;
							}
						}
					}
					for (let i = 0; i < overlap; i++) {
						const currentKey = currentKeys[i];
						if (previousKeys.indexOf(currentKey) === -1) {
							// this node is new
							const measured = currentItemElementMap.get(currentKey);
							if (measured) {
								before -= measured.element.offsetHeight;
							}
						}
					}

					let found = false;
					for (const previousKey of previousKeys) {
						if (found) {
							if (currentKeys.indexOf(previousKey) === -1) {
								// this node no longer exists
								const measured = previousItemElementMap.get(previousKey);
								if (measured) {
									after -= measured.height;
								}
							}
						}
						else if (previousKey === visibleKey) {
							found = true;
						}
					}
					for (let i = (overlap + 1); i < currentKeys.length; i++) {
						const currentKey = currentKeys[i];
						if (previousKeys.indexOf(currentKey) === -1) {
							// this node is new
							const measured = currentItemElementMap.get(currentKey);
							if (measured) {
								after += measured.element.offsetHeight;
							}
						}
					}

					break;
				}
			}

			// TODO: use these numbers
			console.log('before:', before, 'after:', after);
			this.before.style.height = (this.before.offsetHeight + before) + 'px';
			this.after.style.height = (this.after.offsetHeight + after) + "px";

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
			element.style.height = "10000px";
			this.after = element;
			return;
		}
		this.onElementChange(element, key);
	}

	protected onElementUpdated(element: HTMLElement, key: string): void {
		if (key === 'before' || key === 'content' || key === 'after') {
			return;
		}
		this.onElementChange(element, key);
	}

	__render__() {
		const scrollTop = this.scroller && this.scroller.scrollTop;
		const applied = super.__render__.apply(this, arguments);
		setTimeout(() => {
			console.log(this.scroller && this.scroller.scrollTop, 'is now', scrollTop);
		}, 1000);
		return applied;
	}

	render() {
		const {
			items,
			columns,
			registry,
			theme
		} = this.properties;

		return v('div', {
				key: 'scroller',
				classes: this.classes(bodyClasses.scroller),
				onscroll: this.onScroll
			},
			[
				v('div', {
					key: 'content'
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

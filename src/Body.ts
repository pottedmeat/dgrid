import WidgetBase from '@dojo/widget-core/WidgetBase';
import { RegistryMixin, RegistryMixinProperties } from '@dojo/widget-core/mixins/Registry';
import { v, w, decorate, isHNode } from '@dojo/widget-core/d';
import { HasColumns, HasItems, HasRangeEvent, HasOffset, HasTotalLength } from './interfaces';
import { RowProperties } from './Row';
import { ThemeableMixin, theme, ThemeableProperties } from '@dojo/widget-core/mixins/Themeable';
import { ProjectionOptions, VNodeProperties, VNode } from '@dojo/interfaces/vdom';
import { DNode, HNode } from '@dojo/widget-core/interfaces';

import * as bodyClasses from './styles/body.css';
import Map from '@dojo/shim/Map';

interface Measured {
	element: HTMLElement;
	height: number;
}

function isHNodeWithKey(node: DNode): node is HNode {
	return isHNode(node) && node && (node.properties != null) && (node.properties.key != null);
}

export interface BodyProperties extends ThemeableProperties, HasColumns, HasItems, HasOffset, HasTotalLength, HasRangeEvent, RegistryMixinProperties { }

@theme(bodyClasses)
class Body extends ThemeableMixin(RegistryMixin(WidgetBase))<BodyProperties> {
	private itemElementMap = new Map<string, Measured>();
	private scroller: HTMLElement;
	private visible: string[] = [];

	constructor() {
		super();

		const afterCreateCallback = (element: HTMLElement, projectionOptions: ProjectionOptions, vnodeSelector: string, properties: VNodeProperties, children: VNode[]): void => {
			this.onElementCreated(element, String(properties.key));
		};

		const afterUpdateCallback = (element: HTMLElement, projectionOptions: ProjectionOptions, vnodeSelector: string, properties: VNodeProperties, children: VNode[]): void => {
			this.onElementUpdated(element, String(properties.key));
		};

		this.addDecorator('afterRender', (node: DNode) => {
			decorate(node, (node: HNode) => {
				node.properties.afterCreate = afterCreateCallback;
			}, isHNodeWithKey);

			decorate(node, (node: HNode) => {
				node.properties.afterUpdate = afterUpdateCallback;
			}, isHNodeWithKey);
			return node;
		});
	}

	protected onScroll(event: UIEvent) {
		const target = <HTMLElement> event.target;
		const {
			items,
			offset,
			totalLength,
			onRangeRequest
		} = this.properties;

		// find the first visible row
		const scroll = target.scrollTop;
		const contentHeight = this.scroller.offsetHeight;
		let before = 0;
		const visible: string[] = this.visible = [];
		for (let i = 0, item; (item = items[i]); i++) {
			const key = String(item.id);
			const measured = this.itemElementMap.get(key);
			if (measured) {
				const element = measured.element;
				const top = element.offsetTop;
				const height = element.offsetHeight;
				if ((top + height) >= scroll && top < (scroll + contentHeight)) {
					if (!visible.length) {
						before = i;
					}
					visible.push(key);
				}
				else if (visible.length) {
					break;
				}
			}
		}

		// TODO: Completely reload data when visible is empty (totally new data is loaded)

		// 100 before and after
		const start = Math.max(0, offset - 100 + before);
		let count = (Math.min(before, 100) + visible.length + 100);
		if (start + count > totalLength) {
			count = (totalLength - start);
		}

		if (start !== offset || count !== items.length) {
			console.log({ start, count });
			onRangeRequest && onRangeRequest({ start, count });
		}
	}

	protected onElementChange(element: HTMLElement, key: string): void {
		if (key === 'scroller') {
			this.scroller = element;
			return;
		}

		let measured = this.itemElementMap.get(key);
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
		this.itemElementMap.set(key, measured);
	}

	protected onElementCreated(element: HTMLElement, key: string): void {
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

		return v('div', {
				key: 'scroller',
				classes: this.classes(bodyClasses.scroller),
				onscroll: this.onScroll
			},
			[
				v('div', {
					classes: this.classes(bodyClasses.content)
				},
				items.map((item) => {
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
					})
				)
			]
		);
	}
}

export default Body;

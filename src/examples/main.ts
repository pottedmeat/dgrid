import { ProjectorMixin } from '@dojo/widget-core/mixins/Projector';
import Grid from '../Grid';
import ArrayDataProvider from '../providers/ArrayDataProvider';
import { WidgetBase } from '@dojo/widget-core/WidgetBase';
import { WidgetProperties } from '@dojo/widget-core/interfaces';
import { w, v } from '@dojo/widget-core/d';
import { GridProperties } from '../Grid';
import { RenderedValueColumn, RenderedColumn } from '../interfaces';

interface Step {
	order: number;
	name: string;
	description: string;
}

const data = [
	{ order: 1, name: 'preheat', description: 'Preheat your oven to 350F' },
	{ order: 2, name: 'mix dry', description: 'In a medium bowl, combine flour, salt, and baking soda' },
	{ order: 3, name: 'mix butter', description: 'In a large bowl, beat butter, then add the brown sugar and white sugar then mix' },
	{ order: 4, name: 'mix together', description: 'Slowly add the dry ingredients from the medium bowl to the wet ingredients in the large bowl, mixing until the dry ingredients are totally combined' },
	{ order: 5, name: 'chocolate chips', description: 'Add chocolate chips' },
	{ order: 6, name: 'make balls', description: 'Scoop up a golf ball size amount of dough with a spoon and drop in onto a cookie sheet' },
	{ order: 7, name: 'bake', description: 'Put the cookies in the oven and bake for about 10-14 minutes' },
	{ order: 8, name: 'remove', description: 'Using a spatula, lift cookies off onto wax paper or a cooling rack' },
	{ order: 9, name: 'eat', description: 'Eat and enjoy!' }
];

const dataProvider = new ArrayDataProvider({
	idProperty: 'order',
	data
});

const columns = [
	<RenderedValueColumn<Step, number>> {
		get(item) {
			return (item.data.order + 10);
		},
		renderValue(value) {
			return v('span', [
				'Step ',
				String(value)
			]);
		},
		id: 'order',
		label: 'step' // give column a custom name
	},
	<RenderedColumn<Step>> {
		render(item) {
			return item.data.name;
		},
		id: 'name'
	},
	<RenderedValueColumn<Step, string>> {
		renderValue(value) {
			return value;
		},
		id: 'description',
		label: 'what to do',
		sortable: false
	}
];

class Projector extends ProjectorMixin(WidgetBase)<WidgetProperties> {
	render() {
		return w(Grid, <GridProperties> {
			dataProvider,
			columns
		});
	}
}

const projector = new Projector();

projector.append();

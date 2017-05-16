import { ProjectorMixin } from '@dojo/widget-core/mixins/Projector';
import Grid from '../Grid';
import ArrayDataProvider from '../providers/ArrayDataProvider';
import { WidgetBase } from '@dojo/widget-core/WidgetBase';
import { WidgetProperties } from '@dojo/widget-core/interfaces';
import { w } from '@dojo/widget-core/d';
import { GridProperties } from '../Grid';
import { HasScrollTo } from '../interfaces';
import { PaginationDataProviderMixin, GridPagination } from '../GridPagination';
import Pagination from '../Pagination';

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

const instructions: any[] = [];
for (let i = 1; i <= 10000; i++) {
	const instruction = Object.create(data[Math.floor(Math.random() * data.length)]);
	const parent = i;
	if (instruction.order === 2) {
		instructions.push({
			order: ++i,
			name: 'flour',
			description: '1 cup',
			parent
		});
		instructions.push({
			order: ++i,
			name: 'salt',
			description: '1 teaspoon',
			parent
		});
		instructions.push({
			order: ++i,
			name: 'baking soda',
			description: '1 tablespoon',
			parent
		});
	}
	else if (instruction.order === 3) {
		instructions.push({
			order: ++i,
			name: 'butter',
			description: '1/4 cup',
			parent
		});
		instructions.push({
			order: ++i,
			name: 'brown sugar',
			description: '1/4 cup',
			parent
		});
		instructions.push({
			order: ++i,
			name: 'white sugar',
			description: '1/4 cup',
			parent
		});
	}
	else if (instruction.order === 5) {
		instructions.push({
			order: ++i,
			name: 'chocolate chips',
			description: '1 cup',
			parent
		});
	}
	instruction.order = parent;
	instructions.push(instruction);
}

const PaginatedDateProvider = PaginationDataProviderMixin(ArrayDataProvider);

const dataProvider = new PaginatedDateProvider({
	idProperty: 'order',
	data: instructions
});

const columns = [
	{
		id: 'order',
		label: 'step', // give column a custom name
		renderExpando: true
	},
	{
		id: 'name'
	},
	{
		id: 'description',
		label: 'what to do',
		sortable: false
	}
];

const properties: GridProperties & HasScrollTo = {
	dataProvider,
	columns,
	footers: [ w(GridPagination, { dataProvider, itemsPerPage: 10, paginationConstructor: Pagination }) ],
	onScrollToComplete() {
		delete properties.scrollTo;
	}
};

export const ProjectorBase = ProjectorMixin(WidgetBase);

class Projector extends ProjectorBase<WidgetProperties> {
	render() {
		return w(Grid, properties);
	}
}

const projector = new Projector();

projector.append();

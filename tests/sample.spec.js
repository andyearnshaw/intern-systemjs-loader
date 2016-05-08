import register from 'intern!object';
import { expect } from 'intern/chai';

import { Export1, export2 } from './sample.js';

register({
    name: 'A test',

    'should be able to at least run a test': function () {
        expect(true).to.be.ok;
    },

    'should be able to demonstrate a relative import': function () {
        expect(Export1).to.be.a('function');
    },

    'should be able to demonstrate an async test': async function () {
        var answer = await export2();

        expect(answer).to.equal(47);
    }
});

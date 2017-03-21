'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * this is the query-builder
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * it basically uses mquery with a few overwrites
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

exports.create = create;

var _mquery = require('./mquery/mquery');

var _mquery2 = _interopRequireDefault(_mquery);

var _util = require('./util');

var util = _interopRequireWildcard(_util);

var _RxDocument = require('./RxDocument');

var RxDocument = _interopRequireWildcard(_RxDocument);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaultQuery = {
    _id: {}
};

var RxQuery = function () {
    function RxQuery() {
        var queryObj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultQuery;
        var collection = arguments[1];

        _classCallCheck(this, RxQuery);

        this.collection = collection;

        this.defaultQuery = false;

        // force _id
        if (!queryObj._id) queryObj._id = {};

        this.mquery = new _mquery2.default(queryObj);
    }

    // returns a clone of this RxQuery


    _createClass(RxQuery, [{
        key: '_clone',
        value: function _clone() {
            var cloned = new RxQuery(defaultQuery, this.collection);
            cloned.mquery = this.mquery.clone();
            return cloned;
        }
    }, {
        key: 'toString',
        value: function toString() {
            return JSON.stringify(this.mquery);
        }

        // observe the result of this query

    }, {
        key: 'toJSON',
        value: function toJSON() {
            var _this = this;

            var json = {
                selector: this.mquery._conditions
            };

            var options = this.mquery._optionsForExec();

            // sort
            if (options.sort) {
                var sortArray = [];
                Object.keys(options.sort).map(function (fieldName) {
                    var dirInt = options.sort[fieldName];
                    var dir = 'asc';
                    if (dirInt == -1) dir = 'desc';
                    var pushMe = {};
                    // TODO run primary-swap somewhere else
                    if (fieldName == _this.collection.schema.primaryPath) fieldName = '_id';

                    pushMe[fieldName] = dir;
                    sortArray.push(pushMe);
                });
                json.sort = sortArray;
            }

            if (options.limit) {
                if (typeof options.limit !== 'number') throw new TypeError('limit() must get a number');
                json.limit = options.limit;
            }

            if (options.skip) {
                if (typeof options.skip !== 'number') throw new TypeError('skip() must get a number');
                json.skip = options.skip;
            }

            // add not-query to _id to prevend the grabbing of '_design..' docs
            // this is not the best solution because it prevents the usage of a 'language'-field
            if (!json.selector.language) json.selector.language = {};
            json.selector.language.$ne = 'query';

            // primary swap
            if (this.collection.schema.primaryPath && json.selector[this.collection.schema.primaryPath]) {
                var primPath = this.collection.schema.primaryPath;

                // selector
                json.selector._id = json.selector[primPath];
                delete json.selector[primPath];
            }

            return json;
        }
    }, {
        key: 'keyCompress',


        /**
         * get the key-compression version of this query
         * @return {{selector: {}, sort: []}} compressedQuery
         */
        value: function keyCompress() {
            return this.collection._keyCompressor.compressQuery(this.toJSON());
        }

        /**
         * deletes all found documents
         * @return {Promise(RxDocument|RxDocument[])} promise with deleted documents
         */

    }, {
        key: 'remove',
        value: function () {
            var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
                var docs;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                _context.next = 2;
                                return this.exec();

                            case 2:
                                docs = _context.sent;

                                if (!Array.isArray(docs)) {
                                    _context.next = 8;
                                    break;
                                }

                                _context.next = 6;
                                return Promise.all(docs.map(function (doc) {
                                    return doc.remove();
                                }));

                            case 6:
                                _context.next = 10;
                                break;

                            case 8:
                                _context.next = 10;
                                return docs.remove();

                            case 10:
                                return _context.abrupt('return', docs);

                            case 11:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function remove() {
                return _ref.apply(this, arguments);
            }

            return remove;
        }()

        /**
         * make sure it searches index because of pouchdb-find bug
         * @link https://github.com/nolanlawson/pouchdb-find/issues/204
         */

    }, {
        key: 'sort',
        value: function sort(params) {
            var _this2 = this;

            // workarround because sort wont work on unused keys
            if ((typeof params === 'undefined' ? 'undefined' : _typeof(params)) !== 'object') {
                var checkParam = params.charAt(0) == '-' ? params.substring(1) : params;
                if (!this.mquery._conditions[checkParam]) this.mquery.where(checkParam).gt(null);
            } else {
                Object.keys(params).filter(function (k) {
                    return !_this2.mquery._conditions[k] || !_this2.mquery._conditions[k].$gt;
                }).forEach(function (k) {
                    var schemaObj = _this2.collection.schema.getSchemaByObjectPath(k);
                    if (schemaObj.type == 'integer') _this2.mquery.where(k).gt(-Infinity);else _this2.mquery.where(k).gt(null);
                });
            }
            this.mquery.sort(params);
            return this;
        }
    }, {
        key: 'regex',


        /**
         * regex cannot run on primary _id
         * @link https://docs.cloudant.com/cloudant_query.html#creating-selector-expressions
         */
        value: function regex(params) {
            if (this.mquery._path == this.collection.schema.primaryPath) throw new Error('You cannot use .regex() on the primary field \'' + this.mquery._path + '\'');

            this.mquery.regex(params);
            return this;
        }
    }, {
        key: '$',
        get: function get() {
            var _this3 = this;

            if (!this._subject) {
                this._subject = new util.Rx.BehaviorSubject(null);
                this._obsRunning = false;
                var collection$ = this.collection.$.filter(function (cEvent) {
                    return ['INSERT', 'UPDATE', 'REMOVE'].includes(cEvent.data.op);
                }).startWith(1).filter(function (x) {
                    return !_this3._obsRunning;
                }).do(function (x) {
                    return _this3._obsRunning = true;
                }).mergeMap(function () {
                    var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(cEvent) {
                        var docs;
                        return regeneratorRuntime.wrap(function _callee2$(_context2) {
                            while (1) {
                                switch (_context2.prev = _context2.next) {
                                    case 0:
                                        _context2.next = 2;
                                        return _this3.collection._pouchFind(_this3);

                                    case 2:
                                        docs = _context2.sent;
                                        return _context2.abrupt('return', docs);

                                    case 4:
                                    case 'end':
                                        return _context2.stop();
                                }
                            }
                        }, _callee2, _this3);
                    }));

                    return function (_x2) {
                        return _ref2.apply(this, arguments);
                    };
                }()).do(function (x) {
                    return _this3._obsRunning = false;
                }).distinctUntilChanged(function (prev, now) {
                    return util.fastUnsecureHash(prev) == util.fastUnsecureHash(now);
                }).map(function (docs) {
                    return _this3.collection._createDocuments(docs);
                }).do(function (docs) {
                    return _this3._subject.next(docs);
                }).map(function (x) {
                    return '';
                });

                this._observable$ = util.Rx.Observable.merge(this._subject, collection$).filter(function (x) {
                    return typeof x != 'string' || x != '';
                });
            }
            return this._observable$;
        }
    }]);

    return RxQuery;
}();

// tunnel the proto-functions of mquery to RxQuery


var protoMerge = function protoMerge(rxQueryProto, mQueryProto) {
    Object.keys(mQueryProto).filter(function (attrName) {
        return !attrName.startsWith('_');
    }).filter(function (attrName) {
        return !rxQueryProto[attrName];
    }).forEach(function (attrName) {
        rxQueryProto[attrName] = function (p1) {
            this.mquery[attrName](p1);
            return this;
        };
    });
};

var protoMerged = false;
function create() {
    var queryObj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultQuery;
    var collection = arguments[1];

    if ((typeof queryObj === 'undefined' ? 'undefined' : _typeof(queryObj)) !== 'object') throw new TypeError('query must be an object');
    if (Array.isArray(queryObj)) throw new TypeError('query cannot be an array');

    var ret = new RxQuery(queryObj, collection);

    if (!protoMerged) {
        protoMerged = true;
        protoMerge(Object.getPrototypeOf(ret), Object.getPrototypeOf(ret.mquery));
    }

    return ret;
}
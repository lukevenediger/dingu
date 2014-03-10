/// <reference path="../statsdnet-client.js" />
/// <reference path="../bower_components/qunit/qunit/qunit.js" />
/// <reference path="../dingu.js" />

var reset = function () {
    window.testHarness.resetLockStatus();
    dingu.reset();
};

test('Register a single module and fetch it.', function () {
    reset();
    dingu.module('ModuleA', function () {
        return {
            identify: function () {
                return 1;
            }
        };
    });

    var moduleA = dingu.get('ModuleA');
    equal(moduleA.identify(), 1);
});

test('Register two modules with one that depends on the other.', function() {
    reset();
    dingu.module('ModuleA', function () {
        return {
            identify: function () {
                return 1;
            }
        };
    });

    dingu.module('ModuleB', function (ModuleA) {
        return {
            identify: function () {
                return 2;
            },
            myDependency: function () {
                return ModuleA.identify();
            }
        };
    });

    var moduleA = dingu.get('ModuleA');
    var moduleB = dingu.get('ModuleB');
    equal(moduleB.identify(), 2);
    equal(moduleB.myDependency(), 1);
});

test('Register three modules, with one depending on the other two.', function () {
    reset();
    dingu.module('ModuleA', function () {
        return {
            identify: function () {
                return 1;
            }
        };
    });

    dingu.module('ModuleB', function () {
        return {
            identify: function () {
                return 2;
            }
        };
    });

    dingu.module('ModuleC', function (ModuleA, ModuleB) {
        return {
            identify: function () {
                return 3;
            },
            myDependency: function () {
                return ModuleA.identify() + ',' + ModuleB.identify();
            }
        };
    });

    var moduleC = dingu.get('ModuleC');
    equal(moduleC.identify(), 3);
    equal(moduleC.myDependency(), '1,2');
});

test('Register a function that has a comment in the declaration', function () {
    reset();
    dingu.module('ModuleA', function (/* a comment */) {
        return {
            me: function() { return 'ModuleA'; }
        };
    });
    var a = dingu.get('ModuleA');
    equal(a.me(), 'ModuleA');
});

test('Register two functions that have comments in their declarations.', function() {
    reset();
    dingu.module('ModuleA', function (/* a comment */) {
        return {
            me: function() { return 'ModuleA'; }
        };
    });
    dingu.module('ModuleB', function ( /* a comment */ ModuleA) {
        return {
            me: function () { return 'ModuleB'; },
            myDependency: function () { return ModuleA.me(); }
        };
    });
    var a = dingu.get('ModuleA');
    equal(a.me(), 'ModuleA', 'ModuleA retrieved successfully.');
    var b = dingu.get('ModuleB');
    equal(b.me(), 'ModuleB');
    equal(b.myDependency(), 'ModuleA');

});

test('Register a function that has a multi-line parameter declaration.', function () {
    reset();
    dingu.module('ModuleA',
        function (
            ModuleB,
            ModuleC
        ) {
        return {
            me: function() { return 'ModuleA'; }
        };
    });
    dingu.module('ModuleB', function () { });
    dingu.module('ModuleC', function () { });
    var a = dingu.get('ModuleA');
    equal(a.me(), 'ModuleA');
});

test('Register a function that has a multi-line parameter declaration with comments.', function () {
    reset();
    dingu.module('ModuleA',
        function (
            // This is a comment
            ModuleB, /* And an inline comment */
            ModuleC // One more for good measure
            /* plus another on it's own */
        ) {
        return {
            me: function() { return 'ModuleA'; }
        };
    });
    dingu.module('ModuleB', function () { });
    dingu.module('ModuleC', function () { });
    var a = dingu.get('ModuleA');
    equal(a.me(), 'ModuleA');
});

test('Register a singleton and check that it only instantiates once.', function () {
    reset();
    dingu.singleton('SingletonA', function () {
        var startingValue = 0;
        return {
            identify: function () {
                startingValue += 1;
                return startingValue;
            }
        }
    });

    var singleton1 = dingu.get('SingletonA');
    equal(singleton1.identify(), 1);
    var singleton2 = dingu.get('SingletonA');
    equal(singleton2.identify(), 2);
});

test('Throw an error if a circular dependency exists.', function () {
    reset();
    dingu.module('ModuleA', function (ModuleB) { });
    dingu.module('ModuleB', function (ModuleA) { });
    throws(
        function () {
            dingu.get('ModuleA');
        },
        /Calling ModuleA resolved a dependency that depends on this item. Chain: ModuleA->ModuleB->ModuleA/,
        'Circular dependency detected.'
    ); 
});

test('Throw an error if an item is not found.', function () {
    reset();
    throws(
        function() {
            dingu.get('DoesNotExist');
        },
        /Item not found: DoesNotExist - was it registered/,
        'Item not found'
    );
});

test('Return undefined if an item is not found and supressItemNotFoundError is true.', function () {
    reset();
    var result = dingu.get('DoesNotExist', true);
    equal(result, undefined);
});

test('Retrieve a value from the registry.', function () {
    reset();
    dingu.value('foo', 123);
    equal(dingu.get('foo'), 123, 'Value was stored and retrieved');
});

test('Pass a value into another module.', function () {
    reset();
    dingu.value('foo', 123);
    dingu.module('ModuleA', ['foo', function (foo) {
        return {
            hello: function () {
                return foo + 1;
            }
        }
    }]);
    var result = dingu.get('ModuleA').hello();
    equal(result, 124);
});

test('Module injection still works in minification mode', function () {
    reset();
    dingu.module('ModuleA', ['ModuleB', function (ModuleB) {
        return {
            doSomething: function () {
                return 'Hi from ModuleA (' + ModuleB.doSomething() + ')';
            }
        };
    }]);

    dingu.module('ModuleB', function () {
        return {
            doSomething: function () {
                return 'Hi from ModuleB';
            }
        };
    });

    var a = dingu.get('ModuleA');
    equal(a.doSomething(), 'Hi from ModuleA (Hi from ModuleB)');
});

test('Singleton supports minification', function() {
    reset();
    dingu.singleton('SingletonA', ['ModuleA', function (ModuleA) {
        var startingValue = 0;
        return {
            identify: function () {
                startingValue += 1;
                return startingValue + ' (' + ModuleA.doSomething() + ')';
            }
        };
    }]);

    dingu.module('ModuleA', function () {
        return {
            doSomething: function () {
                return 'ModuleA';
            }
        };
    });

    var singleton1 = dingu.get('SingletonA');
    equal(singleton1.identify(), '1 (ModuleA)');
    var singleton2 = dingu.get('SingletonA');
    equal(singleton2.identify(), '2 (ModuleA)');
});

test('Lock dingu and try register a Module, Singleton and Value.', function() {
    reset();
    dingu.lock();
    dingu.module('ModuleA', function () { });
    equal(dingu.get('ModuleA', true), undefined, 'Module was not registered.');
    dingu.singleton('SingletonA', function () { });
    equal(dingu.get('SingletonA', true), undefined, 'Singleton was not registered.');
    dingu.singleton('ValueA', 1);
    equal(dingu.get('ValueA', true), undefined, 'Value was not registered.');
});

test('Lock dingu and try reset.', function () {
    reset();
    dingu.value('ValueA', 1);
    dingu.lock();
    dingu.reset();
    equal(dingu.get('ValueA'), 1, 'Still got value 1 after locking');
});
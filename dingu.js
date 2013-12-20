/**
 * dingu.js - an AngularJS-style dependency injection system
 * Version: 1.0.1
 * (C) 2013 Luke Venediger 
 * Released under the MIT license. 
 * Github home page: https://github.com/lukevenediger/dingu - includes usage examples
 */
(function() {
    var root = this;
    var dingu = {};
    var registry = {};
    dingu.types = {};
    dingu.lookups = {};
    root.dingu = dingu;

    var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

    /**
     * Inspects the function and returns the list of arguments.
     * @param {function} target - the target function
     */
    var getFunctionArguments = function(target, argumentsArray) {
        var args = [];
        var names = [];

        args = argumentsArray || target.toString()
            .match(FN_ARGS)[1]
            .split(',');

        // Go through each name and strip comments
        args.forEach(function(arg) {
            var comments = arg.match(STRIP_COMMENTS);
            if (comments !== null) {
                for (var index = 0; index < comments.length; index++) {
                    arg = arg.replace(comments[index], '');
                }
            }
            arg = arg.trim();
            if (arg !== '') {
                names.push(arg);
            }
        });
        return names;
    };

    /**
     * Resolve a regisrty item to an instance.     
     */
    var resolve = function(registryItem, dependencyChain) {
        // Check for circular dependencies
        dependencyChain.forEach(function(dependency) {
            if (dependency === registryItem.name) {
                throw new dingu.types.CircularDependencyError(registryItem, dependencyChain);
            }
        });

        var dependencies;
        switch (registryItem.type) {
        case RegistryItemType.VALUE:
            // Nothing to do - this was set already
            break;
        case RegistryItemType.SINGLETON:
            if (!registryItem.value) {
                dependencies = resolveDependencies(registryItem.dependencyNames, dependencyChain.concat(registryItem.name));
                registryItem.value = registryItem.target.apply(registryItem.target, dependencies);
            }
            break;
        case RegistryItemType.INSTANCE:
            dependencies = resolveDependencies(registryItem.dependencyNames, dependencyChain.concat(registryItem.name));
            registryItem.value = registryItem.target.apply(registryItem.target, dependencies);
            break;
        }
        return registryItem.value;
    };

    /**
     * Resolve an array of dependencies
     */
    var resolveDependencies = function(names, dependencyChain) {
        return names.map(function(name) {
            if (!registry.hasOwnProperty(name)) {
                throw new Error('Failed to resolve dependency. Could not find a module called ' + name);
            }
            return resolve(registry[name], dependencyChain);
        });
    };

    /** 
     * Registers a new module
     * 
     * @param {string} name
     * @param {function} module
     */
    dingu.module = function(name, module) {
        // Minification logic mapping for "dingu modules"
        var argumentArray = undefined; // UNDEFINED if the module is not an ARRAY
        var moduleFn = module; // Last element in the array (i.e. Angular style)
        if (module instanceof Array) {
            moduleFn = module.pop();
            argumentArray = module;
        }

        registry[name] = new dingu.types.RegistryItem(name, moduleFn, RegistryItemType.INSTANCE, argumentArray);
    };

    /**
     * Registers a new singleton
     *
     * @param {string} name
     * @param {function} singleton - a factory function that builds the singleton
     */
    dingu.singleton = function(name, singleton) {
        registry[name] = new dingu.types.RegistryItem(name, singleton, RegistryItemType.SINGLETON);
    };

    dingu.value = function(name, value) {
        registry[name] = new dingu.types.RegistryItem(name, value, RegistryItemType.VALUE);
    };

    /**
     * Return a registry item.
     * @param {string} itemName
     */
    dingu.get = function(itemName) {
        if (!registry.hasOwnProperty(itemName)) {
            throw new Error('Item not found: ' + itemName + ' - was it registered?');
        }
        return resolve(registry[itemName], []);
    };

    /**
     * Clears out all dependencies from the DI registry
     */
    dingu.reset = function() {
        registry = {};
    };


    /**********************
     * TYPES
     **********************/

    /**
     * Describes an item that's added to the DI registry
     * @constructor
     * @param {string} name - the name of this item
     * @param {function} target - the target function
     * @param {dingu.lookups.RegistryItemType} registryItemType
     */
    dingu.types.RegistryItem = function(name, target, registryItemType, argumentsArray) {
        this.name = name;
        this.target = target;
        this.type = registryItemType;
        this.value = registryItemType === RegistryItemType.VALUE ? target : null;
        this.dependencyNames = registryItemType !== RegistryItemType.VALUE ? getFunctionArguments(target, argumentsArray) : null;
    };

    /**
     * Thrown when a circular dependency is encountered.
     * @constructor
     * @param {dingu.types.RegistryItem} rootItem - the first item that kicked off the resolution
     * @param {Array[string]} dependencyChain - ordered chain of dependencies that have already been resolved
     */
    dingu.types.CircularDependencyError = function(rootItem, dependencyChain) {
        this.rootItem = rootItem;
        this.dependencyChain = dependencyChain;

        this.name = 'CircularDependencyError';
        this.message = 'Calling ' +
            rootItem.name +
            ' resolved a dependency that depends on this item. Chain: ' +
            dependencyChain.join('->') +
            '->' +
            rootItem.name;
    };

    dingu.types.CircularDependencyError.prototype.toString = function() {
        return this.message;
    };

    /**
     * Thrown when an item isn't present in the registry
     * @constructor
     * @param {string} item - the item name
     */
    dingu.types.ItemNotFoundError = function(item) {
        this.item = item;
        this.message = 'Could not find an item called ' + item + ' in the registry.';
    };

    dingu.types.ItemNotFoundError.prototype.toString = function() {
        return this.message;
    };


    /********************
     * LOOKUPS
     ********************/
    dingu.lookups.RegistryItemType = {
        VALUE: 'value',
        SINGLETON: 'singleton',
        INSTANCE: 'instance'
    };

    var RegistryItemType = dingu.lookups.RegistryItemType;

}).call(this);
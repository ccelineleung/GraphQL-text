const { GraphQLError, Kind } = require('graphql');
// const arrify = require('arrify');

/**
 * Creates a validator for the GraphQL query depth
 * @param {Number} maxDepth - The maximum allowed depth for any operation in a GraphQL document.
 * @param {Object} [options]
 * @param {String|RegExp|Function} options.ignore - Stops recursive depth checking based on a field name. Either a string or regexp to match the name, or a function that reaturns a boolean.
 * @param {Function} [callback] - Called each time validation runs. Receives an Object which is a map of the depths for each operation.
 * @returns {Function} The validator function for GraphQL validation phase.
 */

function arrify(value) {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return [value];
  }

  if (typeof value[Symbol.iterator] === 'function') {
    return [...value];
  }

  return [value];
}

const depthLimit = (maxDepth, options = {}, callback = () => {}) => {
  return function (validationContext) {
    try {
      const { definitions } = validationContext.getDocument();

      //return all Kind.FRAGMENT_DEFINITION
      const fragments = getFragments(definitions); 
      //return all Kind.OPERATION_DEFINITION
      const queries = getQueriesAndMutations(definitions);
      const queryDepths = {};

      //   console.log(queries);

      for (let name in queries) {
        queryDepths[name] = determineDepth(
          queries[name],
          fragments,
          0,
          maxDepth,
          validationContext,
          name,
          options
        );
      }

      console.log(queries);
      console.log('------------------queryDepths');
      console.log(queryDepths);
      //   callback(queryDepths);

      //   console.log(`FINAL ANSWERSSSSSS `,validationContext,`end`)
      return validationContext;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
};

module.exports = depthLimit;

//GET ALL FRAGMENTS FROM THE QUERIES
function getFragments(definitions) {
  //   console.log(`getFragments1111111111111122`, definitions, `end`);
  return definitions.reduce((map, definition) => {
    // console.log('-----------------------------');
    // console.log(definition);
    // console.log(`KKKKIIIIINNNNNDNDDDDD1112`, Kind.FRAGMENT_DEFINITION, 'end');
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      // console.log('`````definition.name.value``````',definition.name.value,"end")
      map[definition.name.value] = definition;
    }
    // console.log(`MMMMAAAAPPP222`, map, `END`);
    return map;
  }, {});
}

//GET ALL OPERATION_DEFINITION INCULDING BOTH QUERIES AND MUTATIONS
function getQueriesAndMutations(definitions) {
  return definitions.reduce((map, definition) => {
    if (definition.kind === Kind.OPERATION_DEFINITION) {
      map[definition.name ? definition.name.value : ''] = definition;
    }
    // console.log(`*****************map`, map);
    return map;
  }, {});
}

function determineDepth(
  node,
  //IntrospectionQuery  {
  //     kind: 'OperationDefinition',
  //     operation: 'query',
  //     name: { kind: 'Name', value: 'IntrospectionQuery', loc: [Location] },
  //     variableDefinitions: [],
  //     directives: [],
  //     selectionSet: { kind: 'SelectionSet', selections: [Array], loc: [Location] },
  //     loc: Location {
  //       start: 5,
  //       end: 389,
  //       startToken: [Token],
  //       endToken: [Token],
  //       source: [Source]
  //     }

  fragments, //FRAGMENT_DEFINITION
  depthSoFar, //0
  maxDepth, // 2
  context, //validationContext
  operationName, //IntrospectionQuery
  options // {}
) {
  if (depthSoFar > maxDepth) {
    return context.reportError(
      new GraphQLError(
        `'${operationName}' exceeds maximum operation depth of ${maxDepth}`,
        [node]
      )
    );
  }

  console.log('******** Determine Depth');

  switch (node.kind) {
    case Kind.FIELD:
      // by default, ignore the introspection fields which begin with double underscores
      const shouldIgnore =
        /^__/.test(node.name.value) || seeIfIgnored(node, options.ignore);

      if (shouldIgnore || !node.selectionSet) {
        return 0;
      }
      return (
        1 +
        Math.max(
          ...node.selectionSet.selections.map((selection) =>
            determineDepth(
              selection,
              fragments,
              depthSoFar + 1,
              maxDepth,
              context,
              operationName,
              options
            )
          )
        )
      );
    case Kind.FRAGMENT_SPREAD:
      return determineDepth(
        fragments[node.name.value],
        fragments,
        depthSoFar,
        maxDepth,
        context,
        operationName,
        options
      );
    case Kind.INLINE_FRAGMENT:
    case Kind.FRAGMENT_DEFINITION:
    case Kind.OPERATION_DEFINITION:
      return Math.max(
        ...node.selectionSet.selections.map((selection) =>
          determineDepth(
            selection,
            fragments,
            depthSoFar,
            maxDepth,
            context,
            operationName,
            options
          )
        )
      );
    default:
      throw new Error('uh oh! depth crawler cannot handle: ' + node.kind);
  }
}

function seeIfIgnored(node, ignore) {
  for (let rule of arrify(ignore)) {

    const fieldName = node.name.value;
    switch (rule.constructor) {
      case Function:
        if (rule(fieldName)) {
          return true;
        }
        break;
      case String:
      case RegExp:
        if (fieldName.match(rule)) {
          return true;
        }
        break;
      default:
        throw new Error(`Invalid ignore option: ${rule}`);
    }
  }
  return false;
}

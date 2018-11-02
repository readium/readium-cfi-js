import { Parser } from '../../src/index';

describe('GENERATED CFI PARSER', () => {
  it('parses a CFI with index steps', () => {
    const cfi = 'epubcfi(/4/6/4)';
    const parsedAST = Parser.parse(cfi);

    const expectedAST = {
      type: 'CFIAST',
      cfiString: {
        type: 'path',
        path: {
          type: 'indexStep',
          stepLength: '4',
          idAssertion: undefined,
        },

        localPath: {
          steps: [
            {
              type: 'indexStep',
              stepLength: '6',
              idAssertion: undefined,
            },
            {
              type: 'indexStep',
              stepLength: '4',
              idAssertion: undefined,
            },
          ],
          termStep: '',
        },
      },
    };

    expect(parsedAST).toEqual(expectedAST);
  });

  it('parses a CFI with index steps and indirection steps', () => {
    const cfi = 'epubcfi(/4/6!/4:9)';
    const parsedAST = Parser.parse(cfi);

    const expectedAST = {
      type: 'CFIAST',
      cfiString: {
        type: 'path',
        path: {
          type: 'indexStep',
          stepLength: '4',
          idAssertion: undefined,
        },

        localPath: {
          steps: [
            {
              type: 'indexStep',
              stepLength: '6',
              idAssertion: undefined,
            },
            {
              type: 'indirectionStep',
              stepLength: '4',
              idAssertion: undefined,
            },
          ],
          termStep: {
            type: 'textTerminus',
            offsetValue: '9',
            textAssertion: undefined,
          },
        },
      },
    };

    expect(parsedAST).toEqual(expectedAST);
  });

  it('parses a CFI with an id assertion on an index step', () => {
    const cfi = 'epubcfi(/4[abc]/6!/4:9)';
    const parsedAST = Parser.parse(cfi);

    const expectedAST = {
      type: 'CFIAST',
      cfiString: {
        type: 'path',
        path: {
          type: 'indexStep',
          stepLength: '4',
          idAssertion: 'abc',
        },

        localPath: {
          steps: [
            {
              type: 'indexStep',
              stepLength: '6',
              idAssertion: undefined,
            },
            {
              type: 'indirectionStep',
              stepLength: '4',
              idAssertion: undefined,
            },
          ],
          termStep: {
            type: 'textTerminus',
            offsetValue: '9',
            textAssertion: undefined,
          },
        },
      },
    };

    expect(parsedAST).toEqual(expectedAST);
  });

  it('parses a CFI with an id assertion on an indirection step', () => {
    const cfi = 'epubcfi(/4/6!/4[abc]:9)';
    const parsedAST = Parser.parse(cfi);

    const expectedAST = {
      type: 'CFIAST',
      cfiString: {
        type: 'path',
        path: {
          type: 'indexStep',
          stepLength: '4',
          idAssertion: undefined,
        },

        localPath: {
          steps: [
            {
              type: 'indexStep',
              stepLength: '6',
              idAssertion: undefined,
            },
            {
              type: 'indirectionStep',
              stepLength: '4',
              idAssertion: 'abc',
            },
          ],
          termStep: {
            type: 'textTerminus',
            offsetValue: '9',
            textAssertion: undefined,
          },
        },
      },
    };

    expect(parsedAST).toEqual(expectedAST);
  });

  it('parses a CFI with a csv-only text location assertion on a character terminus', () => {
    const cfi = 'epubcfi(/4/6!/4:9[aaa,bbb])';
    const parsedAST = Parser.parse(cfi);

    const expectedAST = {
      type: 'CFIAST',
      cfiString: {
        type: 'path',
        path: {
          type: 'indexStep',
          stepLength: '4',
          idAssertion: undefined,
        },

        localPath: {
          steps: [
            {
              type: 'indexStep',
              stepLength: '6',
              idAssertion: undefined,
            },
            {
              type: 'indirectionStep',
              stepLength: '4',
              idAssertion: undefined,
            },
          ],
          termStep: {
            type: 'textTerminus',
            offsetValue: '9',
            textAssertion: {
              type: 'textLocationAssertion',
              csv: {
                type: 'csv',
                preAssertion: 'aaa',
                postAssertion: 'bbb',
              },
              parameter: '',
            },
          },
        },
      },
    };

    expect(parsedAST).toEqual(expectedAST);
  });

  it('parses a CFI with a csv-only text location assertion, with preceeding text only, on a character terminus', () => {
    const cfi = 'epubcfi(/4/6!/4:9[aaa,])';
    const parsedAST = Parser.parse(cfi);

    const expectedAST = {
      type: 'CFIAST',
      cfiString: {
        type: 'path',
        path: {
          type: 'indexStep',
          stepLength: '4',
          idAssertion: undefined,
        },

        localPath: {
          steps: [
            {
              type: 'indexStep',
              stepLength: '6',
              idAssertion: undefined,
            },
            {
              type: 'indirectionStep',
              stepLength: '4',
              idAssertion: undefined,
            },
          ],
          termStep: {
            type: 'textTerminus',
            offsetValue: '9',
            textAssertion: {
              type: 'textLocationAssertion',
              csv: {
                type: 'csv',
                preAssertion: 'aaa',
                postAssertion: '',
              },
              parameter: '',
            },
          },
        },
      },
    };

    expect(parsedAST).toEqual(expectedAST);
  });

  it('parses a CFI with a csv-only text location assertion, with subsequent text only, on a character terminus', () => {
    const cfi = 'epubcfi(/4/6!/4:9[,bbb])';
    const parsedAST = Parser.parse(cfi);

    const expectedAST = {
      type: 'CFIAST',
      cfiString: {
        type: 'path',
        path: {
          type: 'indexStep',
          stepLength: '4',
          idAssertion: undefined,
        },

        localPath: {
          steps: [
            {
              type: 'indexStep',
              stepLength: '6',
              idAssertion: undefined,
            },
            {
              type: 'indirectionStep',
              stepLength: '4',
              idAssertion: undefined,
            },
          ],
          termStep: {
            type: 'textTerminus',
            offsetValue: '9',
            textAssertion: {
              type: 'textLocationAssertion',
              csv: {
                type: 'csv',
                preAssertion: '',
                postAssertion: 'bbb',
              },
              parameter: '',
            },
          },
        },
      },
    };

    expect(parsedAST).toEqual(expectedAST);
  });

  it('parses a CFI with a csv and parameter text location assertion on a character terminus', () => {
    const cfi = 'epubcfi(/4/6!/4:9[aaa,bbb;s=b])';
    const parsedAST = Parser.parse(cfi);

    const expectedAST = {
      type: 'CFIAST',
      cfiString: {
        type: 'path',
        path: {
          type: 'indexStep',
          stepLength: '4',
          idAssertion: undefined,
        },

        localPath: {
          steps: [
            {
              type: 'indexStep',
              stepLength: '6',
              idAssertion: undefined,
            },
            {
              type: 'indirectionStep',
              stepLength: '4',
              idAssertion: undefined,
            },
          ],
          termStep: {
            type: 'textTerminus',
            offsetValue: '9',
            textAssertion: {
              type: 'textLocationAssertion',
              csv: {
                type: 'csv',
                preAssertion: 'aaa',
                postAssertion: 'bbb',
              },
              parameter: {
                type: 'parameter',
                LHSValue: 's',
                RHSValue: 'b',
              },
            },
          },
        },
      },
    };

    expect(parsedAST).toEqual(expectedAST);
  });

  it('parses a CFI with parameter-only text location assertion on a character terminus', () => {
    const cfi = 'epubcfi(/4/6!/4:9[;s=b])';
    const parsedAST = Parser.parse(cfi);

    const expectedAST = {
      type: 'CFIAST',
      cfiString: {
        type: 'path',
        path: {
          type: 'indexStep',
          stepLength: '4',
          idAssertion: undefined,
        },

        localPath: {
          steps: [
            {
              type: 'indexStep',
              stepLength: '6',
              idAssertion: undefined,
            },
            {
              type: 'indirectionStep',
              stepLength: '4',
              idAssertion: undefined,
            },
          ],
          termStep: {
            type: 'textTerminus',
            offsetValue: '9',
            textAssertion: {
              type: 'textLocationAssertion',
              csv: '',
              parameter: {
                type: 'parameter',
                LHSValue: 's',
                RHSValue: 'b',
              },
            },
          },
        },
      },
    };

    expect(parsedAST).toEqual(expectedAST);
  });

  it('parses a cfi with all the CFI escape characters', () => {
    const cfi = 'epubcfi(/4[4^^^[^]^(^)^,^;^=]/6!/4:9)';
    const parsedAST = Parser.parse(cfi);

    const expectedAST = {
      type: 'CFIAST',
      cfiString: {
        type: 'path',
        path: {
          type: 'indexStep',
          stepLength: '4',
          idAssertion: '4^[](),;=',
        },

        localPath: {
          steps: [
            {
              type: 'indexStep',
              stepLength: '6',
              idAssertion: undefined,
            },
            {
              type: 'indirectionStep',
              stepLength: '4',
              idAssertion: undefined,
            },
          ],
          termStep: {
            type: 'textTerminus',
            offsetValue: '9',
            textAssertion: undefined,
          },
        },
      },
    };

    expect(parsedAST).toEqual(expectedAST);
  });

  it('parses a range CFI with element targets', () => {
    const cfi = 'epubcfi(/2/2/4,/2/4,/4/6)';
    const parsedAST = Parser.parse(cfi);

    const expectedAST = {
      type: 'CFIAST',
      cfiString: {
        type: 'range',
        path: {
          type: 'indexStep',
          stepLength: '2',
          idAssertion: undefined,
        },

        localPath: {
          steps: [
            {
              type: 'indexStep',
              stepLength: '2',
              idAssertion: undefined,
            },
            {
              type: 'indexStep',
              stepLength: '4',
              idAssertion: undefined,
            },
          ],
          termStep: '',
        },

        range1: {
          steps: [
            {
              type: 'indexStep',
              stepLength: '2',
              idAssertion: undefined,
            },
            {
              type: 'indexStep',
              stepLength: '4',
              idAssertion: undefined,
            },
          ],
          termStep: '',
        },

        range2: {
          steps: [
            {
              type: 'indexStep',
              stepLength: '4',
              idAssertion: undefined,
            },
            {
              type: 'indexStep',
              stepLength: '6',
              idAssertion: undefined,
            },
          ],
          termStep: '',
        },
      },
    };

    expect(parsedAST).toEqual(expectedAST);
  });

  it('parses a range CFI with a text offset terminus', () => {
    const cfi = 'epubcfi(/2/2/4,/2/4:3,/4/6:9)';
    const parsedAST = Parser.parse(cfi);

    const expectedAST = {
      type: 'CFIAST',
      cfiString: {
        type: 'range',
        path: {
          type: 'indexStep',
          stepLength: '2',
          idAssertion: undefined,
        },

        localPath: {
          steps: [
            {
              type: 'indexStep',
              stepLength: '2',
              idAssertion: undefined,
            },
            {
              type: 'indexStep',
              stepLength: '4',
              idAssertion: undefined,
            },
          ],
          termStep: '',
        },

        range1: {
          steps: [
            {
              type: 'indexStep',
              stepLength: '2',
              idAssertion: undefined,
            },
            {
              type: 'indexStep',
              stepLength: '4',
              idAssertion: undefined,
            },
          ],
          termStep: {
            type: 'textTerminus',
            offsetValue: '3',
            textAssertion: undefined,
          },
        },

        range2: {
          steps: [
            {
              type: 'indexStep',
              stepLength: '4',
              idAssertion: undefined,
            },
            {
              type: 'indexStep',
              stepLength: '6',
              idAssertion: undefined,
            },
          ],
          termStep: {
            type: 'textTerminus',
            offsetValue: '9',
            textAssertion: undefined,
          },
        },
      },
    };

    expect(parsedAST).toEqual(expectedAST);
  });
});

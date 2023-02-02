"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SearchBar;
var _react = _interopRequireWildcard(require("react"));
var _reactRouterDom = require("react-router-dom");
var _componentMessageBus = require("@ivoyant/component-message-bus");
var _componentPrompt = require("@ivoyant/component-prompt");
var _componentCache = require("@ivoyant/component-cache");
var _moment = _interopRequireDefault(require("moment"));
var _antd = require("antd");
var Icons = _interopRequireWildcard(require("@ant-design/icons"));
var _shortid = _interopRequireDefault(require("shortid"));
require("./style.css");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
const FileSearchOutlined = Icons['FileSearchOutlined'];
const BellFilled = Icons['BellFilled'];
const DownOutlined = Icons['DownOutlined'];
const UserAddOutlined = Icons['UserAddOutlined'];
const SearchOutlined = Icons['SearchOutlined'];
const {
  Option
} = _antd.Select;
const FilterTag = props => {
  const {
    label,
    closable,
    onClose
  } = props;
  return /*#__PURE__*/_react.default.createElement(_antd.Tag, {
    closable: closable,
    onClose: onClose,
    style: {
      marginRight: 3
    }
  }, label);
};
const {
  Text
} = _antd.Typography;
const handleSearchResponse = (option, history, successStates, errorStates, setLoading, setContactError) => (subscriptionId, topic, eventData, closure) => {
  const state = eventData.value;
  const isSuccess = successStates.includes(state);
  const isFailure = errorStates.includes(state);
  if (isSuccess || isFailure) {
    _componentMessageBus.MessageBus.unsubscribe(subscriptionId);
    if (isSuccess) {
      history.push(option.onSuccess.routeTo, {
        routeData: {
          searchData: eventData?.event?.data?.request?.response,
          searchType: option?.name,
          payload: eventData?.event?.data?.config?.data
        }
      });
    } else if (isFailure) {
      if (option?.name.toLowerCase() === 'contact') {
        setContactError( /*#__PURE__*/_react.default.createElement(_antd.Col, {
          style: {
            display: 'flex',
            gap: '15px'
          }
        }, /*#__PURE__*/_react.default.createElement(FileSearchOutlined, {
          style: {
            color: '#fff',
            fontSize: '30px',
            margin: 'auto'
          }
        }), /*#__PURE__*/_react.default.createElement(Text, {
          style: {
            color: '#fff',
            alignSelf: 'center'
          }
        }, "Sorry, Customer details are not found. Do you want to search by a ne parameter or create contact?")));
      }
    }
    setLoading(false);
  }
};
const processSearchRequest = (option, datasources, history, requestData, setLoading, setContactError) => {
  const {
    workflow = 'SEARCH',
    datasource,
    successStates,
    errorStates,
    requestMapping,
    responseMapping
  } = option;
  const submitEvent = 'SUBMIT';
  if (workflow) {
    setLoading(true);
    _componentMessageBus.MessageBus.send('WF.'.concat(workflow).concat('.INIT'), {
      header: {
        registrationId: workflow,
        workflow,
        eventType: 'INIT'
      }
    });
    _componentMessageBus.MessageBus.subscribe(workflow, 'WF.'.concat(workflow).concat('.STATE.CHANGE'), handleSearchResponse(option, history, successStates, errorStates, setLoading, setContactError), {});
    _componentMessageBus.MessageBus.send('WF.'.concat(workflow).concat('.').concat(submitEvent), {
      header: {
        registrationId: workflow,
        workflow,
        eventType: submitEvent
      },
      body: {
        datasource: datasources[datasource],
        request: requestData,
        requestMapping,
        responseMapping
      }
    });
  }
};
const resetButtonState = toggleState => (subscriptionId, topic, data, closure) => {
  toggleState(true);
  _componentMessageBus.MessageBus.unsubscribe(subscriptionId);
};
function SearchBarButton(props) {
  const {
    id = '',
    tooltip,
    icon,
    initialState = 'enabled',
    onClickEvents = [],
    enableOnEvents = []
  } = props;
  const [disabled, setDisabled] = (0, _react.useState)(initialState !== 'enabled');
  const [toggle, toggleState] = (0, _react.useState)(undefined);
  const [disableAndSendMessage, setDisableAndSendMessage] = (0, _react.useState)(false);
  const Icon = Icons[props?.icon];
  (0, _react.useEffect)(() => {
    if (disableAndSendMessage) {
      setDisabled(!disabled);
      onClickEvents.forEach(ce => _componentMessageBus.MessageBus.send(ce, {}));
      setDisableAndSendMessage(false);
      if (enableOnEvents) {
        enableOnEvents.forEach(ee => {
          _componentMessageBus.MessageBus.subscribe(id.concat('.').concat(ee), ee, resetButtonState(toggleState), {});
        });
      }
    }
  }, [disableAndSendMessage]);
  (0, _react.useEffect)(() => {
    if (toggle) {
      setDisabled(!disabled);
      toggleState(undefined);
    }
  }, [toggle]);
  (0, _react.useEffect)(() => {
    return () => {
      if (enableOnEvents) {
        enableOnEvents.forEach(ee => {
          _componentMessageBus.MessageBus.unsubscribe(id.concat('.').concat(ee));
        });
      }
    };
  }, []);
  return /*#__PURE__*/_react.default.createElement(_antd.Tooltip, {
    title: tooltip
  }, /*#__PURE__*/_react.default.createElement(_antd.Button, {
    icon: /*#__PURE__*/_react.default.createElement(Icon, null),
    ghost: true,
    disabled: disabled,
    onClick: () => setDisableAndSendMessage(!disableAndSendMessage)
  }));
}
const setSearchInfo = (setSearchType, setSelectData) => (subscriptionId, topic, eventData, closure) => {
  const {
    body
  } = eventData;
  const {
    searchType,
    searchParams
  } = body;
  setSearchType(searchType);
  setSelectData(searchParams);
};
function SearchBar(props) {
  const {
    data,
    properties,
    datasources
  } = props;
  const {
    username = 'crm user',
    buttons = [],
    prompt,
    searchEvents
  } = properties;
  const {
    caseCategories,
    casePriorities,
    caseAssignedTeam,
    caseAdditionalProperties
  } = data?.data;
  let {
    options = {}
  } = properties;
  let additionalOptions = {};
  if (options?.Cases) {
    caseAdditionalProperties?.categories?.filter(_ref => {
      let {
        isSearchable,
        name
      } = _ref;
      if (isSearchable === 'true' && !options?.Cases?.fields[name]) {
        additionalOptions[name] = {
          value: name,
          label: name?.charAt(0)?.toUpperCase() + name?.slice(1),
          solo: true,
          additionalProperties: true,
          dateRange: true
        };
      }
    });
  }
  if (Object.keys(additionalOptions)?.length) {
    options = {
      ...options,
      Cases: {
        ...options?.Cases,
        fields: {
          ...options?.Cases?.fields,
          ...additionalOptions
        }
      }
    };
  }
  // const [defaultValue, setDefaultValue] = useState('');
  const [selectedKey, setSelectedKey] = (0, _react.useState)('default');
  const [selectedOptions, setSelectedOptions] = (0, _react.useState)([]);
  const [placeholder, setPlaceHolder] = (0, _react.useState)(options.default.placeholder);
  const [originalOptions, setOriginalOptions] = (0, _react.useState)([]);
  const [keys, setKeys] = (0, _react.useState)(Object.keys(options));
  const [searchType, setSearchType] = (0, _react.useState)(options.default.name);
  const [selectData, setSelectData] = (0, _react.useState)([]);
  const [mode, setMode] = (0, _react.useState)('multiple');
  const [dates, setDates] = (0, _react.useState)([]);
  const [dateRangeDisabled, setDateRangeDisabled] = (0, _react.useState)(true);
  const [enterKeyPressed, setEnterKeyPressed] = (0, _react.useState)(false);
  const [loading, setLoading] = (0, _react.useState)(false);
  const [datesValue, setDatesValue] = (0, _react.useState)([]);
  const history = (0, _reactRouterDom.useHistory)();
  const [contactError, setContactError] = (0, _react.useState)(undefined);
  (0, _react.useEffect)(() => {
    // for autopopulating ctn if present in the local Storage
    const ctiEventData = window.localStorage.getItem('ctiEvent') ? JSON.parse(window.localStorage.getItem('ctiEvent')) : false;
    if (ctiEventData) {
      // setSearchType(searchType);
      setSelectData([{
        type: {
          value: 'ctn',
          solo: true,
          label: 'CTN'
        },
        value: ctiEventData?.eventData?.body?.ctn
      }]);
    }
  }, []);

  // useEffect(() => {
  //     console.log('Select Data is updated with ', selectData);
  // }, [selectData]);

  const getNewOptions = (result, removeFilter) => {
    if (result && result.length === 0 && removeFilter) {
      return getOpts();
    } else {
      let row = originalOptions.filter(type => (removeFilter ? result[result.length - 1].type.label : selectData[selectData.length - 1].type.label) === type.label);
      if (row && row.length > 0) {
        let recs = row.map(r => {
          if (r.terms && r.terms.length > 0) {
            return r.terms.map(rr => {
              return options[selectedKey].fields[rr];
            });
          }
        });
        return recs[0];
      }
      return [];
    }
  };
  const handleChangeFilter = res => {
    if (res.length > selectData.length) {
      if (selectData.length && !selectData[selectData.length - 1].value) {
        const updatedData = selectData.map((item, i, arr) => {
          if (i === arr.length - 1) {
            return {
              ...item,
              value: res[res.length - 1]
            };
          }
          return item;
        });
        if (updatedData[0]?.type?.dateRange) {
          if (dateRangeDisabled) {
            setDateRangeDisabled(!dateRangeDisabled);
          }
        } else {
          if (!dateRangeDisabled) {
            setDateRangeDisabled(!dateRangeDisabled);
          }
        }
        setSelectData(updatedData);
        setSelectedOptions(getNewOptions(updatedData));
        setMode('tags');
      } else {
        _componentCache.cache.remove('sessionInfo');
        let optionData = selectedOptions?.find(opt => opt.value === res[res.length - 1]);
        if (optionData) {
          if (selectData.length === 0) {
            if (optionData.solo) {
              setDetails(setSelectData, selectData, optionData, setDateRangeDisabled, setSelectedOptions, res[res.length - 1], caseCategories, casePriorities, caseAssignedTeam);
            }
          } else {
            setDetails(setSelectData, selectData, optionData, setDateRangeDisabled, setSelectedOptions, res[res.length - 1], caseCategories, casePriorities, caseAssignedTeam);
          }
        } else {
          // setSelectedOptions(originalOptions);
        }
        setMode('tags');
      }
    }
  };
  const location = (0, _reactRouterDom.useLocation)();
  const autoSearchCustomer = sessionStorage?.getItem('searchCustomer') ? JSON.parse(sessionStorage?.getItem('searchCustomer')) : null;
  const tabId = sessionStorage?.getItem('tabId');
  (0, _react.useEffect)(() => {
    if (autoSearchCustomer && tabId !== autoSearchCustomer?.tabId) {
      sessionStorage.removeItem('searchCustomer');
      processSearchRequest(options?.default, datasources, history, {
        dates: [],
        selectData: [{
          type: {
            value: 'billingAccountNumber',
            label: 'BAN',
            solo: true
          },
          value: autoSearchCustomer?.ban
        }]
      }, setLoading, setContactError);
    }
  }, [autoSearchCustomer]);
  (0, _react.useEffect)(() => {
    window[window.sessionStorage?.tabId].setSelectData = setSelectData;
    if (searchEvents) {
      searchEvents.forEach(se => {
        _componentMessageBus.MessageBus.subscribe('search-bar'.concat('.').concat(se), se, setSearchInfo(setSearchType, setSelectData), {});
      });
    }
    _componentMessageBus.MessageBus.subscribe('SAVE.DISPLAY.INTERACTION', 'SAVE.DISPLAY.INTERACTION', processInteractionSearchRequest);
    return () => {
      if (searchEvents) {
        searchEvents.forEach(se => {
          _componentMessageBus.MessageBus.unsubscribe('search-bar'.concat('.').concat(se));
        });
      }
      _componentMessageBus.MessageBus.unsubscribe('SAVE.DISPLAY.INTERACTION');
      delete window[window.sessionStorage?.tabId].setSelectData;
    };
  }, []);
  (0, _react.useEffect)(() => {
    setOptions();
  }, [selectedKey]);
  function setOptions() {
    setOriginalOptions(getOpts());
    setSelectedOptions(getOpts());
  }
  (0, _react.useEffect)(() => {
    if (enterKeyPressed) {
      setEnterKeyPressed(false);
      searchNow();
    }
  }, [enterKeyPressed]);
  (0, _react.useEffect)(() => {
    const route = location.pathname.substring(location.pathname.lastIndexOf('/'));
    const defaultSearchType = options.default.name;
    const matchingType = Object.keys(options).find(option => options[option].routes?.includes(route));
    setSearchType(matchingType ? options[matchingType].name : defaultSearchType);
    setPlaceHolder(matchingType ? options[matchingType].placeholder : options.default.placeholder);
  }, [location]);
  const resolveKey = key => {
    return keys.find(k => k === key) || 'default';
  };
  const getOpts = () => Object.keys(options[resolveKey(selectedKey)]?.fields).map(field => {
    return {
      ...options[resolveKey(selectedKey)].fields[field]
    };
  });
  const resetActions = () => {
    setSelectData([]);
    setMode('multiple');
    setDates([]);
    setDateRangeDisabled(true);
  };
  const handleOnSelectChange = value => {
    setSelectedKey(resolveKey(value));
    setPlaceHolder(options[resolveKey(value)].placeholder);
    resetActions();
  };
  const firstSolo = result => {
    return result && result.length !== 0 && result[0].type.solo ? true : false;
  };
  const handleRemoveFilter = label => {
    const [typeLabel] = label.split(' = ');
    const data = selectData.find(item => item.type.label == typeLabel);
    const dateIndex = selectData.slice().filter(item => item.type.label !== typeLabel).findIndex(item => item.type.date !== undefined && item.type.date === true);
    if (data.type.date && dateIndex === -1) setDateRangeDisabled(true);
    const result = selectData.filter(item => item.type.label !== typeLabel);
    if (firstSolo(result)) {
      setSelectData(result);
      if (mode === 'multiple') {
        const dropdown = originalOptions.filter(typeOption => !result.find(item => item.type.value === typeOption.value));
        setSelectedOptions(dropdown);
      }
      if (mode === 'tags') {
        setSelectedOptions(getNewOptions(result, true));
      }
    } else {
      setSelectedOptions(getOpts());
      setSelectData([]);
    }
  };
  const handleDateChange = (datesValue, dateStrings) => {
    setDatesValue(datesValue);
    setDates(dateStrings);
  };
  const terms = selectData?.find(_ref2 => {
    let {
      type
    } = _ref2;
    return type?.terms;
  })?.type?.terms;
  const checkTerms = selectData?.filter(_ref3 => {
    let {
      type
    } = _ref3;
    return terms?.length > 0 && (terms?.includes(type.label) || terms?.includes(type.value));
  });
  const checkedTerms = checkTerms?.length === terms?.length;
  const enableSearch = selectData?.length === selectData?.filter(_ref4 => {
    let {
      value
    } = _ref4;
    return value;
  })?.length;
  const disableSearch = selectData?.length !== 0 ? terms ? checkedTerms ? false : true : false : true;
  const searchNow = async () => {
    let continueWithSearch = true;
    if (window[window.sessionStorage?.tabId][`Interaction_Source`] !== 'Voice') _componentCache.cache.remove('sessionInfo');
    window.localStorage.removeItem('ctiEvent'); // clearing data from local storage if present.
    _componentCache.cache.remove('smartAction');
    if (prompt) {
      continueWithSearch = await _componentPrompt.Prompt.createAndShow({
        ...prompt
      });
    }
    const selectedOption = options[selectedKey] ? options[selectedKey] : options['default'];
    if (enableSearch && continueWithSearch) {
      const newData = selectData?.map(_ref5 => {
        let {
          type,
          value
        } = _ref5;
        if (selectedKey.toLowerCase() === 'contact' && type.label.toLowerCase() === 'ctn') {
          _componentCache.cache.put(type.label.toLowerCase(), value);
        }
        return {
          type: type,
          value: value
        };
      });
      let excludeClosed = newData?.find(_ref6 => {
        let {
          type
        } = _ref6;
        return type?.excludeClosed;
      });
      let searchObj = {
        selectData: excludeClosed ? [...newData, {
          type: {
            value: 'includeClosed'
          },
          value: false
        }] : newData,
        dates
      };
      if (terms) {
        if (checkedTerms) {
          processSearchRequest(selectedOption, datasources, history, searchObj, setLoading, setContactError);
        }
      } else {
        processSearchRequest(selectedOption, datasources, history, searchObj, setLoading, setContactError);
      }
    }
  };
  const getContactErrorLayout = () => {
    return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_antd.Row, {
      gutter: 16,
      style: {
        alignItems: 'center'
      }
    }, /*#__PURE__*/_react.default.createElement(_antd.Col, null, /*#__PURE__*/_react.default.createElement(_antd.Button, {
      danger: true,
      size: 'small',
      className: "unknown-danger-btn",
      onClick: () => null
    }, "UNKNOWN CALLER")), contactError, /*#__PURE__*/_react.default.createElement(_antd.Col, null, /*#__PURE__*/_react.default.createElement(_antd.Button, {
      type: "primary",
      onClick: () => {
        setContactError(undefined);
        _componentMessageBus.MessageBus.send('CREATECONTACT.SHOW');
        _componentCache.cache.put('contact', true);
      }
    }, "CREATE CONTACT")), /*#__PURE__*/_react.default.createElement(_antd.Col, null, /*#__PURE__*/_react.default.createElement(_antd.Button, {
      onClick: () => setContactError(undefined)
    }, "SEARCH"))));
  };
  const handleInteractionSearchResponse = (option, history, successStates, errorStates) => (subscriptionId, topic, eventData, closure) => {
    const state = eventData.value;
    const isSuccess = successStates.includes(state);
    const isFailure = errorStates.includes(state);
    if (isSuccess || isFailure) {
      _componentMessageBus.MessageBus.unsubscribe(subscriptionId);
      if (isSuccess) {
        _componentMessageBus.MessageBus.send('URL-CHANGE', {
          header: {
            source: 'URL-CHANGE'
          },
          body: {
            routeData: {
              searchData: eventData?.event?.data?.request?.response,
              searchType: option?.name,
              payload: eventData?.event?.data?.config?.data
            },
            url: option.onSuccess.routeTo
          }
        });
      }
    }
  };
  const processInteractionSearchRequest = () => {
    const submitEvent = 'SUBMIT';
    const {
      workflow,
      datasource,
      successStates,
      errorStates,
      requestMapping,
      responseMapping
    } = options?.Interactions;
    if (workflow) {
      _componentMessageBus.MessageBus.send('WF.'.concat(workflow).concat('.INIT'), {
        header: {
          registrationId: workflow,
          workflow,
          eventType: 'INIT'
        }
      });
      _componentMessageBus.MessageBus.subscribe(workflow, 'WF.'.concat(workflow).concat('.STATE.CHANGE'), handleInteractionSearchResponse(options.Interactions, history, successStates, errorStates), {});
      _componentMessageBus.MessageBus.send('WF.'.concat(workflow).concat('.').concat(submitEvent), {
        header: {
          registrationId: workflow,
          workflow,
          eventType: submitEvent
        },
        body: {
          datasource: datasources[datasource],
          request: {
            selectData: [{
              type: {
                value: 'phoneNumber',
                label: 'CTN',
                solo: true
              },
              value: _componentCache.cache.get('interaction').ctn
            }],
            dates: []
          },
          requestMapping,
          responseMapping
        }
      });
    }
  };
  return /*#__PURE__*/_react.default.createElement(_antd.Row, {
    className: "cm-wrapper-header d-flex flex-row justify-content-between align-items-center",
    style: {
      height: 'auto'
    }
  }, contactError ? getContactErrorLayout() : /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_antd.Col, {
    xs: {
      span: 1
    }
  }), /*#__PURE__*/_react.default.createElement(_antd.Col, {
    flex: "auto"
  }, /*#__PURE__*/_react.default.createElement(_antd.Row, {
    className: "searchbox-container",
    justify: "start"
  }, /*#__PURE__*/_react.default.createElement(_antd.Col, null, /*#__PURE__*/_react.default.createElement(_antd.Select, {
    defaultValue: options.default.name,
    className: "select-before slide-in-left",
    onChange: handleOnSelectChange,
    value: options[selectedKey]?.name || selectedKey
  }, keys.map(key => /*#__PURE__*/_react.default.createElement(Option, {
    key: _shortid.default.generate(),
    value: options[key].name || key
  }, options[key].name || key)))), /*#__PURE__*/_react.default.createElement(_antd.Col, {
    flex: "auto"
  }, /*#__PURE__*/_react.default.createElement(_antd.Select, {
    allowClear: true,
    onClear: () => {
      setSelectData([]);
      setOptions();
    },
    mode: mode,
    className: "search-input slide-in-left",
    dropdownMatchSelectWidth: 50,
    placeholder: placeholder,
    value: selectData.map(opt => `${opt.type?.label} = ${opt.value || ''}`),
    onChange: handleChangeFilter,
    options: selectedOptions,
    tagRender: values => /*#__PURE__*/_react.default.createElement(FilterTag, _extends({}, values, {
      onClose: e => {
        handleRemoveFilter(values.label);
        values.onClose(e);
      }
    })),
    onKeyDown: e => {
      if (e.key === 'Enter') {
        setEnterKeyPressed(true);
      }
    }
  })), /*#__PURE__*/_react.default.createElement(_antd.Col, null, /*#__PURE__*/_react.default.createElement(_antd.DatePicker.RangePicker, {
    disabled: dateRangeDisabled,
    onChange: handleDateChange,
    allowEmpty: false,
    onCalendarChange: handleDateChange,
    disabledDate: current => {
      if (!datesValue || datesValue.length === 0) {
        return false;
      } else {
        const tooLate = datesValue[0] && current.diff(datesValue[0], 'days') > 30;
        const tooEarly = datesValue[1] && datesValue[1].diff(current, 'days') > 30;
        return tooEarly || tooLate;
      }
    },
    presets: {
      Today: [(0, _moment.default)(), (0, _moment.default)()],
      Yesterday: [(0, _moment.default)().subtract(1, 'd'), (0, _moment.default)().subtract(1, 'd')],
      'This Week': [(0, _moment.default)().startOf('week'), (0, _moment.default)()]
    }
  })), /*#__PURE__*/_react.default.createElement(_antd.Col, null, /*#__PURE__*/_react.default.createElement(_antd.Button, {
    disabled: disableSearch,
    loading: loading,
    onClick: () => searchNow(),
    icon: /*#__PURE__*/_react.default.createElement(SearchOutlined, null),
    ghost: true
  }, "Search")))), /*#__PURE__*/_react.default.createElement(_antd.Col, {
    xs: {
      span: 2
    },
    style: {
      paddingLeft: '0.5rem'
    },
    className: "slide-in-right"
  }, /*#__PURE__*/_react.default.createElement(_antd.Row, {
    justify: "start",
    gutter: {
      xs: 8,
      sm: 16,
      md: 24,
      lg: 32
    }
  }, buttons.map((b, ind) => /*#__PURE__*/_react.default.createElement(_antd.Col, {
    key: _shortid.default.generate()
  }, /*#__PURE__*/_react.default.createElement(SearchBarButton, b))), /*#__PURE__*/_react.default.createElement(_antd.Col, {
    flex: "auto"
  }))), /*#__PURE__*/_react.default.createElement(_antd.Col, {
    xs: {
      span: 2
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "right-side-icon-container slide-in-right animation-delay-2"
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "icon-counter-container"
  }, /*#__PURE__*/_react.default.createElement(BellFilled, {
    className: "bell-color"
  })), /*#__PURE__*/_react.default.createElement(_antd.Dropdown, {
    menu: /*#__PURE__*/_react.default.createElement(_antd.Menu, null, /*#__PURE__*/_react.default.createElement(_antd.Menu.Item, null, "Settings")),
    className: "account-settings"
  }, /*#__PURE__*/_react.default.createElement("div", null, window[window.sessionStorage?.tabId].COM_IVOYANT_VARS?.attId || username, ' ', /*#__PURE__*/_react.default.createElement(DownOutlined, null)))))));
}
function setDetails(setSelectData, selectData, optionData, setDateRangeDisabled, setSelectedOptions, currentLabel, caseCategories, casePriorities, caseAssignedTeam) {
  setSelectData([...selectData, {
    type: optionData
  }]);
  if (optionData.date) setDateRangeDisabled(true);
  const getOptions = categories => {
    let options = categories?.categories?.map(_ref7 => {
      let {
        name
      } = _ref7;
      return {
        value: name,
        label: name
      };
    });
    return options;
  };
  if (currentLabel === 'category') {
    setSelectedOptions(getOptions(caseCategories));
  } else if (currentLabel === 'priority') {
    setSelectedOptions(getOptions(casePriorities));
  } else if (currentLabel === 'assignedTeam') {
    setSelectedOptions(getOptions(caseAssignedTeam));
  } else {
    setSelectedOptions([]);
  }
}
module.exports = exports.default;
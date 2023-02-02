import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { MessageBus } from '@ivoyant/component-message-bus';
import { Prompt } from '@ivoyant/component-prompt';
import { cache } from '@ivoyant/component-cache';
import moment from 'moment';

import {
    Menu,
    DatePicker,
    Dropdown,
    Select,
    Tag,
    Row,
    Col,
    Tooltip,
    Button,
    Typography,
} from 'antd';
import * as Icons from '@ant-design/icons';

const FileSearchOutlined = Icons['FileSearchOutlined'];
const BellFilled = Icons['BellFilled'];
const DownOutlined = Icons['DownOutlined'];
const UserAddOutlined = Icons['UserAddOutlined'];
const SearchOutlined = Icons['SearchOutlined'];

import shortid from 'shortid';
import './style.css';

const { Option } = Select;

const FilterTag = (props) => {
    const { label, closable, onClose } = props;

    return (
        <Tag closable={closable} onClose={onClose} style={{ marginRight: 3 }}>
            {label}
        </Tag>
    );
};
const { Text } = Typography;

const handleSearchResponse = (
    option,
    history,
    successStates,
    errorStates,
    setLoading,
    setContactError
) => (subscriptionId, topic, eventData, closure) => {
    const state = eventData.value;
    const isSuccess = successStates.includes(state);
    const isFailure = errorStates.includes(state);
    if (isSuccess || isFailure) {
        MessageBus.unsubscribe(subscriptionId);
        if (isSuccess) {
            history.push(option.onSuccess.routeTo, {
                routeData: {
                    searchData: eventData?.event?.data?.request?.response,
                    searchType: option?.name,
                    payload: eventData?.event?.data?.config?.data,
                },
            });
        } else if (isFailure) {
            if (option?.name.toLowerCase() === 'contact') {
                setContactError(
                    <Col style={{ display: 'flex', gap: '15px' }}>
                        <FileSearchOutlined
                            style={{
                                color: '#fff',
                                fontSize: '30px',
                                margin: 'auto',
                            }}
                        />
                        <Text style={{ color: '#fff', alignSelf: 'center' }}>
                            Sorry, Customer details are not found. Do you want
                            to search by a ne parameter or create contact?
                        </Text>
                    </Col>
                );
            }
        }
        setLoading(false);
    }
};

const processSearchRequest = (
    option,
    datasources,
    history,
    requestData,
    setLoading,
    setContactError
) => {
    const {
        workflow = 'SEARCH',
        datasource,
        successStates,
        errorStates,
        requestMapping,
        responseMapping,
    } = option;

    const submitEvent = 'SUBMIT';
    if (workflow) {
        setLoading(true);
        MessageBus.send('WF.'.concat(workflow).concat('.INIT'), {
            header: {
                registrationId: workflow,
                workflow,
                eventType: 'INIT',
            },
        });
        MessageBus.subscribe(
            workflow,
            'WF.'.concat(workflow).concat('.STATE.CHANGE'),
            handleSearchResponse(
                option,
                history,
                successStates,
                errorStates,
                setLoading,
                setContactError
            ),
            {}
        );
        MessageBus.send(
            'WF.'.concat(workflow).concat('.').concat(submitEvent),
            {
                header: {
                    registrationId: workflow,
                    workflow,
                    eventType: submitEvent,
                },
                body: {
                    datasource: datasources[datasource],
                    request: requestData,
                    requestMapping,
                    responseMapping,
                },
            }
        );
    }
};

const resetButtonState = (toggleState) => (
    subscriptionId,
    topic,
    data,
    closure
) => {
    toggleState(true);
    MessageBus.unsubscribe(subscriptionId);
};

function SearchBarButton(props) {
    const {
        id = '',
        tooltip,
        icon,
        initialState = 'enabled',
        onClickEvents = [],
        enableOnEvents = [],
    } = props;
    const [disabled, setDisabled] = useState(initialState !== 'enabled');
    const [toggle, toggleState] = useState(undefined);
    const [disableAndSendMessage, setDisableAndSendMessage] = useState(false);
    const Icon = Icons[props?.icon];

    useEffect(() => {
        if (disableAndSendMessage) {
            setDisabled(!disabled);
            onClickEvents.forEach((ce) => MessageBus.send(ce, {}));
            setDisableAndSendMessage(false);
            if (enableOnEvents) {
                enableOnEvents.forEach((ee) => {
                    MessageBus.subscribe(
                        id.concat('.').concat(ee),
                        ee,
                        resetButtonState(toggleState),
                        {}
                    );
                });
            }
        }
    }, [disableAndSendMessage]);

    useEffect(() => {
        if (toggle) {
            setDisabled(!disabled);
            toggleState(undefined);
        }
    }, [toggle]);

    useEffect(() => {
        return () => {
            if (enableOnEvents) {
                enableOnEvents.forEach((ee) => {
                    MessageBus.unsubscribe(id.concat('.').concat(ee));
                });
            }
        };
    }, []);

    return (
        <Tooltip title={tooltip}>
            <Button
                icon={<Icon />}
                ghost
                disabled={disabled}
                onClick={() => setDisableAndSendMessage(!disableAndSendMessage)}
            ></Button>
        </Tooltip>
    );
}

const setSearchInfo = (setSearchType, setSelectData) => (
    subscriptionId,
    topic,
    eventData,
    closure
) => {
    const { body } = eventData;
    const { searchType, searchParams } = body;

    setSearchType(searchType);
    setSelectData(searchParams);
};

export default function SearchBar(props) {
    const { data, properties, datasources } = props;
    const {
        username = 'crm user',
        buttons = [],
        prompt,
        searchEvents,
    } = properties;
    const {
        caseCategories,
        casePriorities,
        caseAssignedTeam,
        caseAdditionalProperties,
    } = data?.data;
    let { options = {} } = properties;

    let additionalOptions = {};
    if (options?.Cases) {
        caseAdditionalProperties?.categories?.filter(
            ({ isSearchable, name }) => {
                if (isSearchable === 'true' && !options?.Cases?.fields[name]) {
                    additionalOptions[name] = {
                        value: name,
                        label: name?.charAt(0)?.toUpperCase() + name?.slice(1),
                        solo: true,
                        additionalProperties: true,
                        dateRange: true,
                    };
                }
            }
        );
    }

    if (Object.keys(additionalOptions)?.length) {
        options = {
            ...options,
            Cases: {
                ...options?.Cases,
                fields: { ...options?.Cases?.fields, ...additionalOptions },
            },
        };
    }
    // const [defaultValue, setDefaultValue] = useState('');
    const [selectedKey, setSelectedKey] = useState('default');
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [placeholder, setPlaceHolder] = useState(options.default.placeholder);
    const [originalOptions, setOriginalOptions] = useState([]);
    const [keys, setKeys] = useState(Object.keys(options));
    const [searchType, setSearchType] = useState(options.default.name);
    const [selectData, setSelectData] = useState([]);
    const [mode, setMode] = useState('multiple');
    const [dates, setDates] = useState([]);
    const [dateRangeDisabled, setDateRangeDisabled] = useState(true);
    const [enterKeyPressed, setEnterKeyPressed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [datesValue, setDatesValue] = useState([]);
    const history = useHistory();
    const [contactError, setContactError] = useState(undefined);

    useEffect(() => {
        // for autopopulating ctn if present in the local Storage
        const ctiEventData = window.localStorage.getItem('ctiEvent')
            ? JSON.parse(window.localStorage.getItem('ctiEvent'))
            : false;
        if (ctiEventData) {
            // setSearchType(searchType);
            setSelectData([
                {
                    type: {
                        value: 'ctn',
                        solo: true,
                        label: 'CTN',
                    },
                    value: ctiEventData?.eventData?.body?.ctn,
                },
            ]);
        }
    }, []);

    // useEffect(() => {
    //     console.log('Select Data is updated with ', selectData);
    // }, [selectData]);

    const getNewOptions = (result, removeFilter) => {
        if (result && result.length === 0 && removeFilter) {
            return getOpts();
        } else {
            let row = originalOptions.filter(
                (type) =>
                    (removeFilter
                        ? result[result.length - 1].type.label
                        : selectData[selectData.length - 1].type.label) ===
                    type.label
            );
            if (row && row.length > 0) {
                let recs = row.map((r) => {
                    if (r.terms && r.terms.length > 0) {
                        return r.terms.map((rr) => {
                            return options[selectedKey].fields[rr];
                        });
                    }
                });
                return recs[0];
            }
            return [];
        }
    };

    const handleChangeFilter = (res) => {
        if (res.length > selectData.length) {
            if (selectData.length && !selectData[selectData.length - 1].value) {
                const updatedData = selectData.map((item, i, arr) => {
                    if (i === arr.length - 1) {
                        return { ...item, value: res[res.length - 1] };
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
                cache.remove('sessionInfo');
                let optionData = selectedOptions?.find(
                    (opt) => opt.value === res[res.length - 1]
                );
                if (optionData) {
                    if (selectData.length === 0) {
                        if (optionData.solo) {
                            setDetails(
                                setSelectData,
                                selectData,
                                optionData,
                                setDateRangeDisabled,
                                setSelectedOptions,
                                res[res.length - 1],
                                caseCategories,
                                casePriorities,
                                caseAssignedTeam
                            );
                        }
                    } else {
                        setDetails(
                            setSelectData,
                            selectData,
                            optionData,
                            setDateRangeDisabled,
                            setSelectedOptions,
                            res[res.length - 1],
                            caseCategories,
                            casePriorities,
                            caseAssignedTeam
                        );
                    }
                } else {
                    // setSelectedOptions(originalOptions);
                }
                setMode('tags');
            }
        }
    };

    const location = useLocation();

    const autoSearchCustomer = sessionStorage?.getItem('searchCustomer')
        ? JSON.parse(sessionStorage?.getItem('searchCustomer'))
        : null;
    const tabId = sessionStorage?.getItem('tabId');

    useEffect(() => {
        if (autoSearchCustomer && tabId !== autoSearchCustomer?.tabId) {
            sessionStorage.removeItem('searchCustomer');

            processSearchRequest(
                options?.default,
                datasources,
                history,
                {
                    dates: [],
                    selectData: [
                        {
                            type: {
                                value: 'billingAccountNumber',
                                label: 'BAN',
                                solo: true,
                            },
                            value: autoSearchCustomer?.ban,
                        },
                    ],
                },
                setLoading,
                setContactError
            );
        }
    }, [autoSearchCustomer]);

    useEffect(() => {
        window[window.sessionStorage?.tabId].setSelectData = setSelectData;
        if (searchEvents) {
            searchEvents.forEach((se) => {
                MessageBus.subscribe(
                    'search-bar'.concat('.').concat(se),
                    se,
                    setSearchInfo(setSearchType, setSelectData),
                    {}
                );
            });
        }
        MessageBus.subscribe(
            'SAVE.DISPLAY.INTERACTION',
            'SAVE.DISPLAY.INTERACTION',
            processInteractionSearchRequest
        );
        return () => {
            if (searchEvents) {
                searchEvents.forEach((se) => {
                    MessageBus.unsubscribe('search-bar'.concat('.').concat(se));
                });
            }
            MessageBus.unsubscribe('SAVE.DISPLAY.INTERACTION');
            delete window[window.sessionStorage?.tabId].setSelectData;
        };
    }, []);

    useEffect(() => {
        setOptions();
    }, [selectedKey]);

    function setOptions() {
        setOriginalOptions(getOpts());
        setSelectedOptions(getOpts());
    }

    useEffect(() => {
        if (enterKeyPressed) {
            setEnterKeyPressed(false);
            searchNow();
        }
    }, [enterKeyPressed]);

    useEffect(() => {
        const route = location.pathname.substring(
            location.pathname.lastIndexOf('/')
        );
        const defaultSearchType = options.default.name;
        const matchingType = Object.keys(options).find((option) =>
            options[option].routes?.includes(route)
        );
        setSearchType(
            matchingType ? options[matchingType].name : defaultSearchType
        );
        setPlaceHolder(
            matchingType
                ? options[matchingType].placeholder
                : options.default.placeholder
        );
    }, [location]);

    const resolveKey = (key) => {
        return keys.find((k) => k === key) || 'default';
    };

    const getOpts = () =>
        Object.keys(options[resolveKey(selectedKey)]?.fields).map((field) => {
            return { ...options[resolveKey(selectedKey)].fields[field] };
        });

    const resetActions = () => {
        setSelectData([]);
        setMode('multiple');
        setDates([]);
        setDateRangeDisabled(true);
    };
    const handleOnSelectChange = (value) => {
        setSelectedKey(resolveKey(value));
        setPlaceHolder(options[resolveKey(value)].placeholder);
        resetActions();
    };

    const firstSolo = (result) => {
        return result && result.length !== 0 && result[0].type.solo
            ? true
            : false;
    };

    const handleRemoveFilter = (label) => {
        const [typeLabel] = label.split(' = ');
        const data = selectData.find((item) => item.type.label == typeLabel);
        const dateIndex = selectData
            .slice()
            .filter((item) => item.type.label !== typeLabel)
            .findIndex(
                (item) =>
                    item.type.date !== undefined && item.type.date === true
            );
        if (data.type.date && dateIndex === -1) setDateRangeDisabled(true);

        const result = selectData.filter(
            (item) => item.type.label !== typeLabel
        );
        if (firstSolo(result)) {
            setSelectData(result);
            if (mode === 'multiple') {
                const dropdown = originalOptions.filter(
                    (typeOption) =>
                        !result.find(
                            (item) => item.type.value === typeOption.value
                        )
                );
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

    const terms = selectData?.find(({ type }) => type?.terms)?.type?.terms;
    const checkTerms = selectData?.filter(
        ({ type }) =>
            terms?.length > 0 &&
            (terms?.includes(type.label) || terms?.includes(type.value))
    );
    const checkedTerms = checkTerms?.length === terms?.length;

    const enableSearch =
        selectData?.length === selectData?.filter(({ value }) => value)?.length;
    const disableSearch =
        selectData?.length !== 0
            ? terms
                ? checkedTerms
                    ? false
                    : true
                : false
            : true;

    const searchNow = async () => {
        let continueWithSearch = true;
        if (
            window[window.sessionStorage?.tabId][`Interaction_Source`] !==
            'Voice'
        )
            cache.remove('sessionInfo');
        window.localStorage.removeItem('ctiEvent'); // clearing data from local storage if present.
        cache.remove('smartAction');
        if (prompt) {
            continueWithSearch = await Prompt.createAndShow({ ...prompt });
        }

        const selectedOption = options[selectedKey]
            ? options[selectedKey]
            : options['default'];

        if (enableSearch && continueWithSearch) {
            const newData = selectData?.map(({ type, value }) => {
                if (
                    selectedKey.toLowerCase() === 'contact' &&
                    type.label.toLowerCase() === 'ctn'
                ) {
                    cache.put(type.label.toLowerCase(), value);
                }
                return { type: type, value: value };
            });

            let excludeClosed = newData?.find(
                ({ type }) => type?.excludeClosed
            );

            let searchObj = {
                selectData: excludeClosed
                    ? [
                          ...newData,
                          { type: { value: 'includeClosed' }, value: false },
                      ]
                    : newData,
                dates,
            };

            if (terms) {
                if (checkedTerms) {
                    processSearchRequest(
                        selectedOption,
                        datasources,
                        history,
                        searchObj,
                        setLoading,
                        setContactError
                    );
                }
            } else {
                processSearchRequest(
                    selectedOption,
                    datasources,
                    history,
                    searchObj,
                    setLoading,
                    setContactError
                );
            }
        }
    };
    const getContactErrorLayout = () => {
        return (
            <>
                <Row gutter={16} style={{ alignItems: 'center' }}>
                    <Col>
                        <Button
                            danger
                            size={'small'}
                            className="unknown-danger-btn"
                            onClick={() => null}
                        >
                            UNKNOWN CALLER
                        </Button>
                    </Col>
                    {contactError}
                    <Col>
                        <Button
                            type="primary"
                            onClick={() => {
                                setContactError(undefined);
                                MessageBus.send('CREATECONTACT.SHOW');
                                cache.put('contact', true);
                            }}
                        >
                            CREATE CONTACT
                        </Button>
                    </Col>
                    <Col>
                        <Button onClick={() => setContactError(undefined)}>
                            SEARCH
                        </Button>
                    </Col>
                </Row>
            </>
        );
    };

    const handleInteractionSearchResponse = (
        option,
        history,
        successStates,
        errorStates
    ) => (subscriptionId, topic, eventData, closure) => {
        const state = eventData.value;
        const isSuccess = successStates.includes(state);
        const isFailure = errorStates.includes(state);
        if (isSuccess || isFailure) {
            MessageBus.unsubscribe(subscriptionId);
            if (isSuccess) {
                MessageBus.send('URL-CHANGE', {
                    header: {
                        source: 'URL-CHANGE',
                    },
                    body: {
                        routeData: {
                            searchData:
                                eventData?.event?.data?.request?.response,
                            searchType: option?.name,
                            payload: eventData?.event?.data?.config?.data,
                        },
                        url: option.onSuccess.routeTo,
                    },
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
            responseMapping,
        } = options?.Interactions;

        if (workflow) {
            MessageBus.send('WF.'.concat(workflow).concat('.INIT'), {
                header: {
                    registrationId: workflow,
                    workflow,
                    eventType: 'INIT',
                },
            });
            MessageBus.subscribe(
                workflow,
                'WF.'.concat(workflow).concat('.STATE.CHANGE'),
                handleInteractionSearchResponse(
                    options.Interactions,
                    history,
                    successStates,
                    errorStates
                ),
                {}
            );

            MessageBus.send(
                'WF.'.concat(workflow).concat('.').concat(submitEvent),
                {
                    header: {
                        registrationId: workflow,
                        workflow,
                        eventType: submitEvent,
                    },
                    body: {
                        datasource: datasources[datasource],
                        request: {
                            selectData: [
                                {
                                    type: {
                                        value: 'phoneNumber',
                                        label: 'CTN',
                                        solo: true,
                                    },
                                    value: cache.get('interaction').ctn,
                                },
                            ],
                            dates: [],
                        },
                        requestMapping,
                        responseMapping,
                    },
                }
            );
        }
    };

    return (
        <Row
            className="cm-wrapper-header d-flex flex-row justify-content-between align-items-center"
            style={{ height: 'auto' }}
        >
            {contactError ? (
                getContactErrorLayout()
            ) : (
                <>
                    <Col xs={{ span: 1 }} />
                    <Col flex="auto">
                        <Row className="searchbox-container" justify="start">
                            <Col>
                                <Select
                                    defaultValue={options.default.name}
                                    className="select-before slide-in-left"
                                    onChange={handleOnSelectChange}
                                    value={
                                        options[selectedKey]?.name ||
                                        selectedKey
                                    }
                                >
                                    {keys.map((key) => (
                                        <Option
                                            key={shortid.generate()}
                                            value={options[key].name || key}
                                        >
                                            {options[key].name || key}
                                        </Option>
                                    ))}
                                </Select>
                            </Col>
                            <Col flex="auto">
                                <Select
                                    allowClear
                                    onClear={() => {
                                        setSelectData([]);
                                        setOptions();
                                    }}
                                    mode={mode}
                                    className="search-input slide-in-left"
                                    dropdownMatchSelectWidth={50}
                                    placeholder={placeholder}
                                    value={selectData.map(
                                        (opt) =>
                                            `${opt.type?.label} = ${
                                                opt.value || ''
                                            }`
                                    )}
                                    onChange={handleChangeFilter}
                                    options={selectedOptions}
                                    tagRender={(values) => (
                                        <FilterTag
                                            {...values}
                                            onClose={(e) => {
                                                handleRemoveFilter(
                                                    values.label
                                                );
                                                values.onClose(e);
                                            }}
                                        />
                                    )}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setEnterKeyPressed(true);
                                        }
                                    }}
                                />
                            </Col>
                            <Col>
                                <DatePicker.RangePicker
                                    disabled={dateRangeDisabled}
                                    onChange={handleDateChange}
                                    allowEmpty={false}
                                    onCalendarChange={handleDateChange}
                                    disabledDate={(current) => {
                                        if (
                                            !datesValue ||
                                            datesValue.length === 0
                                        ) {
                                            return false;
                                        } else {
                                            const tooLate =
                                                datesValue[0] &&
                                                current.diff(
                                                    datesValue[0],
                                                    'days'
                                                ) > 30;
                                            const tooEarly =
                                                datesValue[1] &&
                                                datesValue[1].diff(
                                                    current,
                                                    'days'
                                                ) > 30;
                                            return tooEarly || tooLate;
                                        }
                                    }}
                                    presets={{
                                        Today: [moment(), moment()],
                                        Yesterday: [
                                            moment().subtract(1, 'd'),
                                            moment().subtract(1, 'd'),
                                        ],
                                        'This Week': [
                                            moment().startOf('week'),
                                            moment(),
                                        ],
                                    }}
                                />
                            </Col>
                            <Col>
                                <Button
                                    disabled={disableSearch}
                                    loading={loading}
                                    onClick={() => searchNow()}
                                    icon={<SearchOutlined />}
                                    ghost
                                >
                                    Search
                                </Button>
                            </Col>
                        </Row>
                    </Col>
                    <Col
                        xs={{ span: 2 }}
                        style={{ paddingLeft: '0.5rem' }}
                        className="slide-in-right"
                    >
                        <Row
                            justify="start"
                            gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}
                        >
                            {buttons.map((b, ind) => (
                                <Col key={shortid.generate()}>
                                    <SearchBarButton {...b} />
                                </Col>
                            ))}
                            <Col flex="auto" />
                        </Row>
                    </Col>
                    <Col xs={{ span: 2 }}>
                        <div className="right-side-icon-container slide-in-right animation-delay-2">
                            <div className="icon-counter-container">
                                <BellFilled className="bell-color" />
                            </div>
                            <Dropdown
                                menu={
                                    <Menu>
                                        <Menu.Item>Settings</Menu.Item>
                                    </Menu>
                                }
                                className="account-settings"
                            >
                                <div>
                                    {window[window.sessionStorage?.tabId]
                                        .COM_IVOYANT_VARS?.attId ||
                                        username}{' '}
                                    <DownOutlined />
                                </div>
                            </Dropdown>
                        </div>
                    </Col>
                </>
            )}
        </Row>
    );
}

function setDetails(
    setSelectData,
    selectData,
    optionData,
    setDateRangeDisabled,
    setSelectedOptions,
    currentLabel,
    caseCategories,
    casePriorities,
    caseAssignedTeam
) {
    setSelectData([
        ...selectData,
        {
            type: optionData,
        },
    ]);
    if (optionData.date) setDateRangeDisabled(true);

    const getOptions = (categories) => {
        let options = categories?.categories?.map(({ name }) => {
            return { value: name, label: name };
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

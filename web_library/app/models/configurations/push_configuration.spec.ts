import {PushConfiguration} from './push_configuration';
import {readJSON} from '../../services/mocks/mocks_loader';
import {Mechanism} from '../mechanisms/mechanism';
import {RatingMechanism} from '../mechanisms/rating_mechanism';
import {mechanismTypes} from '../../js/config';
import {ParameterValuePropertyPair} from '../parameters/parameter_value_property_pair';
import {ScreenshotMechanism} from '../mechanisms/screenshot_mechanism';
import {ConfigurationFactory} from './configuration_factory';


describe('PushConfiguration object', () => {
    let configuration:PushConfiguration;

    beforeEach(() => {
        var applications = readJSON('app/services/mocks/applications_mock.json', '/base/');
        var application = applications[0];
        var pushConfigurationData = application.configurations[0];
        configuration = ConfigurationFactory.createByData(pushConfigurationData);
    });

    it('should be an object with a general configuration and some mechanisms', () => {
        expect(configuration.mechanisms.length).toBe(4);
        var textMechanismConfig = configuration.mechanisms[0];
        expect(textMechanismConfig.type).toEqual('TEXT_TYPE');
        expect(textMechanismConfig.active).toEqual(true);
        expect(textMechanismConfig.order).toEqual(1);
        expect(textMechanismConfig.canBeActivated).toEqual(false);

        var ratingMechanismConfig = configuration.mechanisms[3];
        expect(ratingMechanismConfig.type).toEqual('RATING_TYPE');
    });

    it('should have typed mechanism objects in its mechanism', () => {
        expect(configuration.mechanisms.length).toBe(4);
        var textMechanismConfig = configuration.mechanisms[0];
        expect(textMechanismConfig.type).toEqual('TEXT_TYPE');
        expect(textMechanismConfig).toEqual(jasmine.any(Mechanism));

        var ratingMechanismConfig = configuration.mechanisms[3];
        expect(ratingMechanismConfig.type).toEqual('RATING_TYPE');
        expect(ratingMechanismConfig).toEqual(jasmine.any(RatingMechanism));

        var screenshotMechanismConfig = configuration.mechanisms[2];
        expect(screenshotMechanismConfig.type).toEqual('SCREENSHOT_TYPE');
        expect(screenshotMechanismConfig).toEqual(jasmine.any(ScreenshotMechanism));
    });

    it('should return the context for the view with the configuration data', () => {
        var context = configuration.getContextForView();

        var expectedContext = {
            textMechanism: {
                active: true,
                hint: 'Please enter your feedback',
                label: 'Please write about your problem',
                currentLength: 0,
                maxLength: 200,
                maxLengthVisible: 1,
                textareaStyle: 'color: #7A7A7A;',
                labelStyle: 'text-align: left; color: #353535; font-size: 15px;',
                clearInput: 0,
                mandatory: 1,
                mandatoryReminder: 'Please fill in the text field',
                validateOnSkip: 1
            },
            ratingMechanism: {
                active: true,
                title: 'Rate your user experience on this page'
            },
            screenshotMechanism: {
                active: true
            },
            categoryMechanism: null,
            dialogId: 'pushConfiguration'
        };

        expect(context).toEqual(expectedContext);
    });

    it('should return the corresponding mechanisms', () => {
        var textMechanism = configuration.getMechanismConfig('TEXT_TYPE');

        expect(textMechanism).toEqual(jasmine.any(Mechanism));
        expect(textMechanism).not.toBeNull();

        expect(textMechanism.type).toEqual('TEXT_TYPE');
        expect(textMechanism.active).toEqual(true);
        expect(textMechanism.order).toEqual(1);
        expect(textMechanism.canBeActivated).toEqual(false);
    });

    it('should return a rating mechanism object', () => {
        var ratingMechanism = configuration.getMechanismConfig('RATING_TYPE');

        expect(ratingMechanism).toEqual(jasmine.any(RatingMechanism));
        expect(ratingMechanism).not.toBeNull();

        expect(ratingMechanism.type).toEqual('RATING_TYPE');
        expect(ratingMechanism.active).toEqual(true);
        expect(ratingMechanism.order).toEqual(4);
        expect(ratingMechanism.canBeActivated).toEqual(false);
    });

    it('should return a css style string', () => {
        var textMechanism = configuration.getMechanismConfig(mechanismTypes.textType);

        var cssStyle = configuration.getCssStyle(textMechanism, [new ParameterValuePropertyPair('textareaFontColor', 'color')]);
        expect(cssStyle).toEqual('color: #7A7A7A;');

        var cssStyle2 = configuration.getCssStyle(textMechanism,
            [new ParameterValuePropertyPair('textareaFontColor', 'color'), new ParameterValuePropertyPair('fieldFontType', 'font-style')]);
        expect(cssStyle2).toEqual('color: #7A7A7A; font-style: italic;');
    })
});

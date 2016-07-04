import {ConfigurationService} from '../services/configuration_service';
import {Feedback} from './feedback';


describe('Feedback', () => {

    it('should validate itself according to the given configuration data', () => {
        var data = [
            {
                "type": "TEXT_TYPE",
                "active": true,
                "order": 1,
                "canBeActivated": false,
                "parameters": [
                    {
                        "key": "maxLength",
                        "value": 100
                    },
                    {
                        "key": "title",
                        "value": "Feedback"
                    },
                    {
                        "key": "hint",
                        "value": "Enter your feedback"
                    }
                ]
            }
        ];

        var configurationService = new ConfigurationService(data);
        var feedback = new Feedback('Feedback', 'application', null, 'This is my feedback!', 1.0, []);

        expect(feedback.validate(configurationService)).toBeTruthy();
    });

    it('should return error messages if the validation was not successful', () => {
        var data = [
            {
                "type": "TEXT_TYPE",
                "active": true,
                "order": 1,
                "canBeActivated": false,
                "parameters": [
                    {
                        "key": "maxLength",
                        "value": 100
                    },
                    {
                        "key": "title",
                        "value": "Feedback"
                    },
                    {
                        "key": "hint",
                        "value": "Enter your feedback"
                    }
                ]
            }
        ];

        var configurationService = new ConfigurationService(data);
        var feedback = new Feedback('Feedback', 'application', null, '', 1.0, []);

        var errors = feedback.validate(configurationService);
        expect(errors.textMechanism.length).toBe(1);
        expect(errors.ratingMechanism.length).toBe(0);
        expect(errors.general.length).toBe(0);

        expect(errors.textMechanism[0]).toEqual('Please input a text');
    });
});


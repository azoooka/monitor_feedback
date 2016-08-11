import './lib/jquery.star-rating-svg.js';
import './jquery.validate';
import {
    apiEndpoint, feedbackPath, applicationName, defaultSuccessMessage,
    feedbackObjectTitle, dialogOptions, mechanismTypes, configurationTypes
} from './config';
import {PaginationContainer} from '../views/pagination_container';
import {ScreenshotView} from '../views/screenshot/screenshot_view';
import {I18nHelper} from './helpers/i18n';
import i18n = require('i18next');
import {MockBackend} from '../services/backends/mock_backend';
import {RatingMechanism} from '../models/mechanisms/rating_mechanism';
import {PullConfiguration} from '../models/configurations/pull_configuration';
import {Feedback} from '../models/feedbacks/feedback';
import {Rating} from '../models/feedbacks/rating';
import {PageNavigation} from './helpers/page_navigation';
import {ConfigurationInterface} from '../models/configurations/configuration_interface';
import {Application} from '../models/applications/application';
import {ApplicationService} from '../services/application_service';
import {shuffle} from './helpers/array_shuffle';
import {ScreenshotMechanism} from '../models/mechanisms/screenshot_mechanism';
import * as dialogTemplate from '../templates/feedback_dialog.handlebars';
import * as pullDialogTemplate from '../templates/feedback_dialog.handlebars';
import * as intermediateDialogTemplate from '../templates/intermediate_dialog.handlebars';
var mockData = require('json!../services/mocks/applications_mock.json');


export var feedbackPluginModule = function ($, window, document) {
    var dialog;
    var pushConfigurationDialogId = "pushConfiguration";
    var pullDialog;
    var pullConfigurationDialogId = "pullConfiguration";
    var active = false;
    var application:Application;

    /**
     * @param applicationObject
     *  The current application object that configures the library.
     */
    var initApplication = function(applicationObject:Application) {
        application = applicationObject;
        resetMessageView();
        initPushMechanisms(application.getPushConfiguration());

        var alreadyTriggeredOne = false;

        for(var pullConfiguration of shuffle(application.getPullConfigurations())) {
            alreadyTriggeredOne = initPullConfiguration(pullConfiguration, alreadyTriggeredOne);
        }
    };

    /**
     * @param configuration
     *  PushConfiguration data retrieved from the feedback orchestrator
     *
     * Initializes the mechanism objects with the configuration data. It then constructs the context variable for the
     * template and invokes the feedbackDialog template with the configuration data.
     * Furthermore, the pagination inside the dialog is initialized, the rating component is configured, the dialog
     * is configured and displayed and some events are added to the UI.
     * All events on the HTML have to be added after the template is appended to the body (if not using live binding).
     */
    var initPushMechanisms = function (configuration) {
        var context = configuration.getContextForView();

        var pageNavigation = new PageNavigation(configuration, $('#' + pushConfigurationDialogId));
        dialog = initTemplate(dialogTemplate, pushConfigurationDialogId, context, configuration, pageNavigation);
    };

    /**
     * Initializes the pull mechanisms and triggers the feedback mechanisms if necessary.
     *
     * @param configuration
     * @param alreadyTriggeredOne
     *  Boolean that indicated whether a pull configuration has already been triggered.
     *
     * @returns boolean
     *  Whether the pull configuration was triggered or not.
     */
    var initPullConfiguration = function(configuration:PullConfiguration, alreadyTriggeredOne:boolean = false): boolean {
        if(!alreadyTriggeredOne && configuration.shouldGetTriggered()) {
            var pageNavigation = new PageNavigation(configuration, $('#' + pullConfigurationDialogId));
            var context = configuration.getContextForView();
            pullDialog = initTemplate(pullDialogTemplate, pullConfigurationDialogId, context, configuration, pageNavigation);
            if(configuration.generalConfiguration.getParameterValue('intermediateDialog')) {
                var intermediateDialog = initIntermediateDialogTemplate(intermediateDialogTemplate, 'intermediateDialog', configuration, pullDialog);
                if(intermediateDialog !== null) {
                    intermediateDialog.dialog('open');
                }
            } else {
                openDialog(pullDialog, configuration);
            }
            return true;
        }
        return false;
    };

    var initTemplate = function (template, dialogId, context, configuration, pageNavigation): HTMLElement {
        var html = template(context);
        $('body').append(html);

        // after template is loaded
        new PaginationContainer($('#' + dialogId + '.feedback-container .pages-container'), pageNavigation);
        initRating("#" + dialogId + " .rating-input", configuration.getMechanismConfig(mechanismTypes.ratingType));
        var screenshotView = initScreenshot(configuration.getMechanismConfig(mechanismTypes.screenshotType), dialogId);
        var dialog = initDialog($('#'+ dialogId), configuration.getMechanismConfig(mechanismTypes.textType));
        addEvents(dialogId, configuration);
        pageNavigation.screenshotView = screenshotView;
        return dialog;
    };

    var initIntermediateDialogTemplate = function(template, dialogId, configuration, pullDialog): HTMLElement {
        var html = template({});
        $('body').append(html);

        var dialog = initDialog($('#'+ dialogId), null);
        $('#feedbackYes').on('click', function() {
            dialog.dialog('close');
            openDialog(pullDialog, configuration);
        });
        $('#feedbackNo').on('click', function() {
            dialog.dialog('close');
        });
        $('#feedbackLater').on('click', function() {
            dialog.dialog('close');
        });
        return dialog;
    };

    /**
     * This method takes the data from the text mechanism and the rating mechanism and composes a feedback object with
     * the help of this data.
     * Then an AJAX request is done to send the submitted feedback to the feedback repository. A success or failure
     * message is shown after the request is done.
     */
    var sendFeedback = function (formData:FormData, configuration:ConfigurationInterface) {
        var screenshotView = configuration.getMechanismConfig(mechanismTypes.screenshotType).screenshotView;
        var ratingMechanism = configuration.getMechanismConfig(mechanismTypes.ratingType);

        $.ajax({
            url: apiEndpoint + feedbackPath,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                $('.server-response').addClass('success').text(defaultSuccessMessage);
                $('textarea.text-type-text').val('');
                screenshotView.reset();
                initRating(".rating-input", ratingMechanism);
            },
            error: function (data) {
                $('.server-response').addClass('error').text('Failure: ' + JSON.stringify(data));
            }
        });
    };

    /**
     * @param selector
     *  The jQuery selector that matches the element the star rating should be applied on
     * @param ratingMechanism
     *  The rating mechanism object that contains the configuration
     *
     * Applies the jQuery star rating plugin on a specified element with the configuration from the rating mechanism.
     */
    var initRating = function (selector, ratingMechanism:RatingMechanism) {
        if(ratingMechanism !== null && ratingMechanism.active) {
            var options = ratingMechanism.getRatingElementOptions();
            $('' + selector).starRating(options);
            // reset to default rating
            $('' + selector + ' .jq-star:nth-child(' + ratingMechanism.initialRating + ')').click();
        }
    };

    var initScreenshot = function (screenshotMechanism, containerId): ScreenshotView {
        if(screenshotMechanism == null) {
            return;
        }
        var container = $('#' + containerId);
        var dialogSelector = $('[aria-describedby="' + containerId + '"]');

        var screenshotPreview = container.find('.screenshot-preview'),
            screenshotCaptureButton = container.find('button.take-screenshot'),
            elementToCapture = $('#page-wrapper_1'),
            elementsToHide = [$('.ui-widget-overlay.ui-front'), dialogSelector];
        // TODO attention: circular dependency
        var screenshotView = new ScreenshotView(screenshotMechanism, screenshotPreview, screenshotCaptureButton,
            elementToCapture, container, elementsToHide);

        screenshotMechanism.setScreenshotView(screenshotView);
        return screenshotView;
    };

    /**
     * @param dialogContainer
     *  Element that contains the dialog content
     * @param textMechanism
     *  The text mechanism object that contains the configuration
     *
     * Initializes the dialog on a given element and opens it.
     */
    // TODO extract the dialog to another module
    var initDialog = function (dialogContainer, textMechanism) {
        var dialogObject = dialogContainer.dialog(
            $.extend({}, dialogOptions, {
                close: function () {
                    dialogObject.dialog("close");
                    active = false;
                }
            })
        );

        // TODO move title to general configuration
        if(textMechanism) {
            dialogObject.dialog('option', 'title', textMechanism.getParameter('title').value);
        } else {
            dialogObject.dialog('option', 'title', 'Feedback');
        }
        return dialogObject;
    };

    /**
     * @param containerId
     *  The ID of the surrounding element that contains the feedback mechanisms
     * @param configuration
     *  Configuration used to set the events
     *
     * Adds the following events:
     * - Send event for the feedback form
     * - Character count event for the text mechanism
     */
    var addEvents = function (containerId, configuration:ConfigurationInterface) {
        var container = $('#' + containerId);
        var textarea = container.find('textarea.text-type-text');
        var textMechanism = configuration.getMechanismConfig(mechanismTypes.textType);

        // send
        container.find('button.submit-feedback').unbind().on('click', function (event) {
            event.preventDefault();
            event.stopPropagation();

            // validate anyway before sending
            if(textMechanism) {
                textarea.validate();
                if (!textarea.hasClass('invalid')) {
                    var formData = prepareFormData(container, configuration);
                    sendFeedback(formData, configuration);
                }
            } else {
                var formData = prepareFormData(container, configuration);
                sendFeedback(formData, configuration);
            }
        });

        // character length
        if(textMechanism) {
            var maxLength = textMechanism.getParameter('maxLength').value;
            textarea.on('keyup focus', function () {
                container.find('span.text-type-max-length').text($(this).val().length + '/' + maxLength);
            });

            // text clear button
            container.find('.text-type-text-clear').on('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                textarea.val('');
            });
        }
    };

    /**
     * Creates the multipart form data containing the data of the active mechanisms.
     *
     * @returns {FormData}
     */
    var prepareFormData = function (container:JQuery, configuration:ConfigurationInterface):FormData {
        var formData = new FormData();
        var textMechanism = configuration.getMechanismConfig(mechanismTypes.textType);
        var ratingMechanism = configuration.getMechanismConfig(mechanismTypes.ratingType);
        var screenshotMechanism = configuration.getMechanismConfig(mechanismTypes.screenshotType);

        container.find('.server-response').removeClass('error').removeClass('success');
        var feedbackObject = new Feedback(feedbackObjectTitle, applicationName, "uid12345", null, 1.0, null);

        if (textMechanism.active) {
            feedbackObject.text = container.find('textarea.text-type-text').val();
        }
        if (ratingMechanism.active) {
            var ratingTitle = container.find('.rating-text').text().trim();
            var rating = new Rating(ratingTitle, ratingMechanism.currentRatingValue);
            feedbackObject.ratings = [];
            feedbackObject.ratings.push(rating);
        }
        if (screenshotMechanism.active && screenshotMechanism.screenshotView.getScreenshotAsBinary() !== null) {
            formData.append('file', screenshotMechanism.screenshotView.getScreenshotAsBinary());
        }

        formData.append('json', JSON.stringify(feedbackObject));
        return formData;
    };

    /**
     * The configuration data is fetched from the API if the feedback mechanism is not currently active. In the other
     * case the feedback mechanism dialog is closed. The active variable is toggled on each invocation.
     */
    var toggleDialog = function (pushConfiguration) {
        if (!active) {
            openDialog(dialog, pushConfiguration);
        } else {
            dialog.dialog("close");
        }
        active = !active;
    };

    var openDialog = function(dialog, configuration) {
        var screenshotMechanism:ScreenshotMechanism = configuration.getMechanismConfig(mechanismTypes.screenshotType);
        if(screenshotMechanism !== null && screenshotMechanism !== undefined && screenshotMechanism.screenshotView !== null) {
            screenshotMechanism.screenshotView.checkAutoTake();
        }
        dialog.dialog('open');
    };

    var resetMessageView = function () {
        $('.server-response').removeClass('error').removeClass('success').text('');
    };

    /**
     * @param options
     *  Client side configuration of the feedback library
     * @returns {jQuery}
     *
     * The feedbackPlugin() function can get applied to a HTML element. This element is then configured via the passed
     * options and the default options. If a click event on this element happens the configuration is fetched from the
     * server and the feedback mechanism is invoked.
     */
    $.fn.feedbackPlugin = function (options) {
        this.options = $.extend({}, $.fn.feedbackPlugin.defaults, options);
        var currentOptions = this.options;
        var resources = {
            en: {translation: require('json!../locales/en/translation.json')},
            de: {translation: require('json!../locales/de/translation.json')}
        };

        I18nHelper.initializeI18n(resources, this.options);

        // loadDataHere to trigger pull if necessary
        var applicationService = new ApplicationService(new MockBackend(mockData));
        applicationService.retrieveApplication(1, function(application) {
            initApplication(application);
        });

        this.css('background-color', currentOptions.backgroundColor);
        this.css('color', currentOptions.color);
        this.on('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            toggleDialog(application.getPushConfiguration());
        });

        return this;
    };

    $.fn.feedbackPlugin.defaults = {
        'color': '#fff',
        'lang': 'en',
        'backgroundColor': '#b3cd40'
    };

};

(function ($, window, document) {
    feedbackPluginModule($, window, document);
})(jQuery, window, document);

requirejs.config({
    "shim": {
        "feedbackPlugin": ["jquery"]
    }
});
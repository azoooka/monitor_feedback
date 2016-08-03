import {ConfigurationInterface} from '../../models/configurations/configuration_interface';
import i18n = require('i18next');
import {ScreenshotView} from '../../views/screenshot/screenshot_view';
import './../jquery.validate.js';
import {textType, ratingType, screenshotType} from '../config';


export class PageNavigation {
    configuration:ConfigurationInterface;
    container:JQuery;
    screenshotView:ScreenshotView;

    constructor(configuration:ConfigurationInterface, container:JQuery) {
        this.configuration = configuration;
        this.container = container;
    }

    /**
     *
     * @param currentPage
     * @param nextPage
     * @returns {boolean}
     *  indicates whether the navigation forward should happen (true) or not (false)
     */
    pageForwardCallback(currentPage, nextPage) {
        var textMechanism = this.configuration.getMechanismConfig(textType);
        var ratingMechanism = this.configuration.getMechanismConfig(ratingType);
        var screenshotMechanism = this.configuration.getMechanismConfig(screenshotType);

        currentPage.find('.validate').each(function () {
            $(this).validate();
        });
        if (currentPage.find('.invalid').length > 0 && currentPage.find('.validate[data-mandatory-validate-on-skip="1"]').length > 0) {
            return false;
        }
        if (nextPage) {
            if (textMechanism != null && nextPage.find('.text-review').length > 0 && textMechanism.active) {
                nextPage.find('.text-review').text(currentPage.find('textarea.text-type-text').val());
            }
            if (ratingMechanism != null && nextPage.find('.rating-review').length > 0 && ratingMechanism.active) {
                nextPage.find('.rating-review').text(i18n.t('rating.review_title') + ": " + ratingMechanism.currentRatingValue + " / " + ratingMechanism.getParameterValue("maxRating"));
            }
            if (screenshotMechanism != null && nextPage.find('.screenshot-review').length > 0 && screenshotMechanism.active && this.screenshotView !== undefined && this.screenshotView.screenshotCanvas !== undefined) {
                var img = $('<img src="' + this.screenshotView.screenshotCanvas.toDataURL() + '" />');
                img.css('max-width', '20%');
                nextPage.find('.screenshot-review').empty().append(img);
            }
        }
        return true;
    }

}
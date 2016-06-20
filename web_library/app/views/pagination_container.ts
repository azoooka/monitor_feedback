export class PaginationContainer {
    container:JQuery;
    pages:JQuery;
    activePage:number;

    constructor(container) {
        this.container = container;
        this.pages = this.container.find('.feedback-page');
        this.showFirstPage();
        this.addNavigationEvents();
        this.activePage = 1;
    }

    showFirstPage() {
        this.pages.hide();
        this.container.find('.feedback-page[data-feedback-page="1"]').show();
    }

    addNavigationEvents() {
        var paginationContainerThis = this;
        this.container.find('.feedback-dialog-forward').on('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            paginationContainerThis.navigateForward();
        });
        this.container.find('.feedback-dialog-backward').on('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            paginationContainerThis.navigateBackward();
        });
    }

    navigateForward() {
        var feedbackPage = this.container.find('.feedback-page[data-feedback-page="' + this.activePage + '"]');
        if(this.activePage < this.pages.length) {
            this.activePage++;
        }
        feedbackPage.hide();
        var nextPage = this.container.find('.feedback-page[data-feedback-page="' + this.activePage + '"]');
        nextPage.show();

        if(nextPage.find('#textReview').length > 0) {
            nextPage.find('#textReview').text(jQuery('textarea#textTypeText').val());
        }
    }

    navigateBackward() {
        var feedbackPage = this.container.find('.feedback-page[data-feedback-page="' + this.activePage + '"]');
        if(this.activePage > 1) {
            this.activePage--;
        }
        feedbackPage.hide();
        this.container.find('.feedback-page[data-feedback-page="' + this.activePage + '"]').show();
    }
}
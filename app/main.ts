import { UpgradeModule, downgradeComponent, downgradeInjectable } from '@angular/upgrade/static';
import { UpgradeAdapter } from '@angular/upgrade';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';
import { EditContainerComponent } from './../typescript/policy-edit/policy-edit.module';
import { ServiceSetup } from './../typescript/core-services';
import { PurchaseContainerComponent } from './../typescript/purchase/purchase.module';
import { QuickQuoteContainerComponent } from './../typescript/quick-quote/quick-quote.module';
import { ReceiptComponent } from './../typescript/shared';
import { AmbassadorInformationSessionStorage } from './../typescript/shared/services/ambassador-session.service';
import { CoverageModalLinkComponent } from './../typescript/coverage-modal/coverage-modal-link.component';

declare var angular: any;

// downgrade the editContainer component so it becomes the
// edit-container directive in angular 1 with policy-number as an input
angular.module('agentPortal')
    .directive(
    'editContainer',
    downgradeComponent({
        component: EditContainerComponent,
        inputs: ['policyNumber', 'agent'],
        outputs: ['navigateToPolicyDetails', 'editCompleted'],
    }) as angular.IDirectiveFactory)
    .factory('serviceSetup', downgradeInjectable(ServiceSetup));
   
angular.module('agentPortal')
    .directive(
    'purchaseContainer',
    downgradeComponent({
        component: PurchaseContainerComponent,
        inputs: ['ratingId', 'agent', 'customer', 'step', 'sessionId', 'quoteId'],
        outputs: ['stepChanged', 'packageChanged', 'purchaseCompleted']
    }) as angular.IDirectiveFactory);

angular.module('agentPortal')
    .directive(
    'quickQuoteContainer',
    downgradeComponent({
        component: QuickQuoteContainerComponent,
        inputs: ['quote', 'maxTravelers', 'showFlightSegments', 'agentGuide', 'agentPortalGuide', 'consumerDomain', 'agent'],
        outputs: ['validQuote', 'valuesChanged', 'serviceCall', 'serviceError', 'stateChanged', 'temporaryQuoteChanged', 'agentCodeChanged']
    }) as angular.IDirectiveFactory);

angular.module('agentPortal')
    .directive(
    'receipt',
    downgradeComponent({
        component: ReceiptComponent,
        inputs: ['policyNumber'],
        outputs: ['viewPolicy', 'editPolicy']
    }) as angular.IDirectiveFactory)

angular.module('agentPortal')
    .directive(
    'coverageModalLink',
    downgradeComponent({
        component: CoverageModalLinkComponent,
        inputs: ['product', 'wasPurchased', 'showDocLink']
    }) as angular.IDirectiveFactory)

angular.module('agentPortal')
    .factory('ambassadorInformationSessionStorage', downgradeInjectable(AmbassadorInformationSessionStorage));

// angular 2 is now the entry point to the app, and it bootstraps agent portal in angular 1
const platform = platformBrowserDynamic();
platform.bootstrapModule(AppModule).then(platformRef => {
    const upgrade = platformRef.injector.get(UpgradeModule) as UpgradeModule;
    upgrade.bootstrap(document.body, ['agentPortal'], { strictDi: false });
});
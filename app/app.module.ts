import { NgModule, Inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import { downgradeComponent } from '@angular/upgrade/src/aot/downgrade_component';
import { downgradeInjectable } from '@angular/upgrade/src/aot/downgrade_injectable';
import { UpgradeComponent } from '@angular/upgrade/src/aot/upgrade_component';

import { PurchaseModule, PurchaseContainerComponent } from './../typescript/purchase/purchase.module';
import { QuickQuoteModule, QuickQuoteContainerComponent } from './../typescript/quick-quote/quick-quote.module';
import { PolicyEditModule, EditContainerComponent } from './../typescript/policy-edit/policy-edit.module';
import { CoreServicesModule, ServiceSetup } from './../typescript/core-services';
import { SharedModule } from './../typescript/shared/shared.module';
import { BhtpTypeaheadServiceModule } from '@bhtp-client-api/typeahead';
import { BhtpEligibilityModule } from '@bhtp-client-api/eligibility';
import { ReceiptComponent } from './../typescript/shared/components';
import { AmbassadorInformationSessionStorage } from './../typescript/shared//services/ambassador-session.service';
import { CoverageModalLinkComponent, CoverageModal } from './../typescript/quick-quote/quick-quote.module';

/**
 * This is the module that allows agent portal to use Angular 2
 */
@NgModule({
    imports: [
        BrowserModule,
        UpgradeModule,
        PolicyEditModule,
        PurchaseModule,
        QuickQuoteModule,
        BhtpTypeaheadServiceModule,
        BhtpEligibilityModule,
        CoreServicesModule,
        SharedModule
    ],
    entryComponents: [
        EditContainerComponent,
        PurchaseContainerComponent,
        QuickQuoteContainerComponent,
        ReceiptComponent,
        CoverageModalLinkComponent,
        CoverageModal
    ],
    providers: [
        AmbassadorInformationSessionStorage
    ]
})
export class AppModule {

    constructor(private serviceSetup: ServiceSetup) {
        serviceSetup.injectUrls();
        serviceSetup.injectOrigin();
        serviceSetup.injectAuthTokenFromLocalStorage();
        serviceSetup.injectFeatures();
        serviceSetup.injectTypeaheadConfig();
    }

    ngDoBootstrap() { }
}
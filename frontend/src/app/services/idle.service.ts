// import { Injectable, NgZone } from '@angular/core';
// import { Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';
// import { Keepalive } from '@ng-idle/keepalive';
// import { MatDialog, MatDialogRef } from "@angular/material/dialog";
// import { ConfirmationDialog } from "@geonature_common/others/modal-confirmation/confirmation.dialog";
// import { Router } from '@angular/router';

// @Injectable({
//   providedIn: 'root'
// })
// export class IdleService {

//   private dialogRef: MatDialogRef<ConfirmationDialog>

//   function : any;
//   idleState = 'Not started.';
//   timedOut = false;
//   lastPing?: Date|null = null;
//   isExpirationTimePassed: boolean = false;

//   constructor(
//     private idle: Idle,
//     private keepalive: Keepalive,
//     public dialog: MatDialog,
//     private router: Router,
//     private ngZone: NgZone

//   ) {
//   }

//   /**
//    * Checks to see if idle service is currently running
//    */
//    isServiceRunning() {
//     return this.idle.isRunning();
//   }

//   /**
//    * Starts the idle service
//    */
//   startIdleSvc() {
//     if (this.idle.isRunning()) {
//       this.idle.stop();
//     }

//     this.idle.watch();
//   }

//   /**
//    * Stops the idle services
//    */
//   stopIdleSvc() {
//     this.idle.stop();
//   }

//   setUp(): any{
//     // Nombre de secondes d'inactivité avant d'être considéré Inactif
//     this.idle.setIdle(600);
//     // Nombre de secondes d'inactivité avant que le time out ne s'applique
//     this.idle.setTimeout(10);
//     // sets the default interrupts, in this case, things like clicks, scrolls, touches to the document
//     this.idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

//     this.idle.onIdleEnd.subscribe(() => {
//       this.ngZone.run(() => {
//         this.dialogRef.close(true)
//       });
//       this.reset();
//     });

//     this.idle.onTimeout.subscribe(() => {
//       this.dialogRef.componentInstance.data = {message: "Vous avez été déconnecté pour inactivité", displayButtons: false};
//       this.timedOut = true;
//     });

//     this.idle.onIdleStart.subscribe(() => {
//         const message = "Vous êtes inactifs. Voulez vous rester connecté?" ;
//         this.dialogRef = this.dialog.open(ConfirmationDialog, {
//           width: "350px",
//           position: { top: "5%" },
//           data: { message: message, displayButtons: true },
//         });

//         this.dialogRef.afterClosed().subscribe((confirmed: boolean) => {
//           this.afterModalClosedFunctions(confirmed);
//         })

//       });

//     this.idle.onTimeoutWarning.subscribe((countdown) => {
//       const message = "Vous allez être déconnecté pour inactivité dans " + countdown + " secondes." ;
//       if (this.dialogRef && this.dialogRef.componentInstance) {
//         this.dialogRef.componentInstance.data = {message: message, displayButtons: false};
//       }
//     });

//     // sets the ping interval to 15 seconds
//     this.keepalive.interval(15);

//     this.keepalive.onPing.subscribe(() =>
//       this.setExpirationTime()
//     );
//     this.reset();
//   }

//   reset() {
//     this.idle.watch();
//     this.idleState = 'Started.';
//     this.timedOut = false;
//   }

//   setExpirationTime() {
//       localStorage.setItem("_expirationTime", String(Date.now() + this.idle.getIdle() * 1000));
//   }

//   cleanExpirationTime() {
//     localStorage.removeItem("_expirationTime");
//   }

//   isSessionExpired() {
//     let expirationTime = parseInt(localStorage.getItem("_expirationTime")!, 10);
//     this.isExpirationTimePassed = true;
//     return expirationTime < Date.now()
//   }

//   showExpirationMessage(){
//     this.dialogRef = this.dialog.open(ConfirmationDialog, {
//       width: "350px",
//       position: { top: "5%" },
//       data: { message: "Vous avez été déconnecté pour inactivité", displayButtons: false },
//     });
//     this.dialogRef.afterClosed().subscribe(() => {
//       this.afterModalClosedFunctions(false);
//       this.isExpirationTimePassed = false;

//     })
//   }

//   afterModalClosedFunctions(confirmed: boolean){
//     if(confirmed){
//       this.reset();
//     } else if (confirmed === undefined){
//       if(!this.timedOut || !this.isExpirationTimePassed){
//         this.reset();
//       } else {
//         this.router.navigate(['/logout']);
//       }
//     } else {
//       this.router.navigate(['/logout']);
//     }
//   }

// }

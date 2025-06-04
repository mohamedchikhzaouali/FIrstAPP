import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomeComponentLogin } from './components/TemplateComponents/home-login/home.login.component';
import { HomeComponentLogout } from './components/TemplateComponents/home-logout/home.logout.component';
import { DashboardComponent } from './components/TemplateComponents/dashboard/dashboard.component';
import { FrontHeaderTeacherComponent } from './components/TemplateComponents/front-header-teacher/front-header-teacher.component';
import { FrontHeaderStudentComponent } from './components/TemplateComponents/front-header-student/front-header-student.component';
import { FrontFooterComponent } from './components/TemplateComponents/front-footer/front-footer.component';
import { BackHeaderComponent } from './components/TemplateComponents/back-header/back-header.component';
import { BackMenuAdminComponent } from './components/TemplateComponents/back-menu-admin/back-menu-admin.component';
//Start Course
import { CoursesListComponent } from './components/GuestionCourseComponents/courses-list/courses-list.component';
import { AdminCoursesComponent } from './components/GuestionCourseComponents/admin-courses/admin-courses.component';
import { DetailsCourseComponent } from './components/GuestionCourseComponents/details-course/details-course.component';
import { AddDetailsCourseComponent } from './components/GuestionCourseComponents/add-details-course/add-details-course.component';
import { DashboardStatisticsComponent } from './components/GuestionCourseComponents/dashboard-statistics/dashboard-statistics.component';
import { ListReviewComponent } from './components/GuestionCourseComponents/list-review/list-review.component';
import { FavoritCoursesComponent } from './components/GuestionCourseComponents/favorit-courses/favorit-courses.component';
import { CoursesSoonComponent } from './components/GuestionCourseComponents/courses-soon/courses-soon.component';
import { SafePipe } from './safe-pipe.pipe';
import { CoursesTeachersComponent } from './components/GuestionCourseComponents/courses-teachers/courses-teachers.component';
import localeFr from '@angular/common/locales/fr';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormatDurationPipe } from './pipes/format-duration.pipe';
// CORRECT (remonte d'un niveau puis descend dans Core/services)
// Ensure the correct path to the module or remove this line if the file does not exist or is not needed
// import { WebsocketService, SocketClientState } from '../Core/services/websocket.service';

//End Course

//Start User
import { LoginComponent } from './components/GuestionUserComponents/login/login.component';
import { SignupComponent } from './components/GuestionUserComponents/signup/signup.component';
import { ProfileComponent } from './components/GuestionUserComponents/profile/profile.component';
import { UsersListComponent } from './components/GuestionUserComponents/users-list/users-list.component';
import { RecaptchaFormsModule, RecaptchaModule } from 'ng-recaptcha';
import { ResetPasswordComponent } from './components/GuestionUserComponents/reset-password/reset-password.component';
import { StatUserComponent } from './components/GuestionUserComponents/stats-user/stats-user.component';

//End User

//Start Quiz
import { QuizComponent } from './components/GuestionQuizComponents/quiz/quiz.component';
import { QuestionComponent } from './components/GuestionQuizComponents/question/question.component';
import { ResponseComponent } from './components/GuestionQuizComponents/response/response.component';
import { AddQuizComponent } from './components/GuestionQuizComponents/add-quiz/add-quiz.component';
import { AddQuestionComponent } from './components/GuestionQuizComponents/add-question/add-question.component';
import { AddResponseComponent } from './components/GuestionQuizComponents/add-response/add-response.component';
import { UpdateQuizComponent } from './components/GuestionQuizComponents/update-quiz/update-quiz.component';
import { UpdateQuestionComponent } from './components/GuestionQuizComponents/update-question/update-question.component';
import { UpdateResponseComponent } from './components/GuestionQuizComponents/update-response/update-response.component';
import { TakeQuizComponent } from './components/GuestionQuizComponents/take-quiz/take-quiz.component';
import { QuizStatisticsComponent } from './components/GuestionQuizComponents/quiz-statistics/quiz-statistics.component';
import { GenerateCertifComponent } from './components/GuestionQuizComponents/generate-certif/generate-certif.component';
import { StripePaymentComponent } from './components/GuestionQuizComponents/stripe-payment/stripe-payment.component';
import { TakeQuizTrainingComponent } from './components/GuestionQuizComponents/take-quiz-training/take-quiz-training.component';
import { QuizGeneratorComponent } from './components/GuestionQuizComponents/quiz-generator/quiz-generator.component';
import { NgChartsModule } from 'ng2-charts';
//End Quiz

//Start Reclamation
import { AjouterReclamationComponent } from './components/GuestionReclamComponents/ajouter-reclamation/ajouter-reclamation.component';
import { ListeReclamationsComponent } from './components/GuestionReclamComponents/liste-reclamation/liste-reclamation.component';
import { AdminReclamationComponent } from './components/GuestionReclamComponents/admin-reclamation/admin-reclamation.component';
import { ListTeacherComponent } from './components/GuestionReclamComponents/list-teacher/list-teacher.component';
import { ReclamationStatsComponent } from './components/GuestionReclamComponents/reclamation-stats/reclamation-stats.component';
import { ArticleComponent } from './components/GestionArticle/article/article.component';
import { ArticleDetailsComponent } from './components/GestionArticle/article-details/article-details.component';
import { AddArticleComponent } from './components/GestionArticle/add-article/add-article.component';
import { EditArticleComponent } from './components/GestionArticle/edit-article/edit-article.component';
import { BackArticleComponent } from './components/GestionArticle/back-article/back-article.component';
import { FavoritesComponent } from './components/GestionArticle/favorites/favorites.component';
import { ChatbotComponent } from './components/GestionArticle/chatbot/chatbot.component';
import { ArticleServiceService } from './services/ArticleService/article-service.service';
import { TranslationService } from './services/ArticleService/translation.service';
import { TextToSpeechService } from './services/ArticleService/text-to-speech.service copy';
import { FavoriteService } from './services/ArticleService/favorite.service';
import { SimilarArticlesService } from './services/ArticleService/similar-articles.service';
import { ChatbotService } from './services/ArticleService/chatbot.service';
import { RouterModule } from '@angular/router';
import { LineToBrPipe } from './pipes/line-to-br.pipe';
import { PredictionComponent } from './components/machineLearning/prediction/prediction.component';
import { ClusteringComponent } from './components/machineLearning/clustering/clustering.component';
import { RecommandationComponent } from './components/machineLearning/recommandation/recommandation.component';
//End Reclamation


@NgModule({
  declarations: [
    AppComponent,
    HomeComponentLogin,
    HomeComponentLogout,
    DashboardComponent,
    FrontHeaderStudentComponent,
    FrontHeaderTeacherComponent,
    FrontFooterComponent,
    BackHeaderComponent,
    BackMenuAdminComponent,
   
  //Start User
    LoginComponent,
    SignupComponent,
    ProfileComponent,
    FrontHeaderStudentComponent,
    UsersListComponent,
    ResetPasswordComponent,
    StatUserComponent,
  //End User

  //Start Course
    CoursesListComponent,
    AdminCoursesComponent,
    DetailsCourseComponent,
    AddDetailsCourseComponent,
    DashboardStatisticsComponent,
    ListReviewComponent,
    FavoritCoursesComponent,
    CoursesSoonComponent,
    SafePipe,
    CoursesTeachersComponent,
    FormatDurationPipe,
  //End Course

  //Start Quiz
    QuizComponent,
    QuestionComponent,
    ResponseComponent,
    AddQuizComponent,
    AddQuestionComponent,
    AddResponseComponent,
    UpdateQuizComponent,
    UpdateQuestionComponent,
    UpdateResponseComponent,
    TakeQuizComponent,
    QuizStatisticsComponent,
    GenerateCertifComponent,
    StripePaymentComponent,
    TakeQuizTrainingComponent,
    QuizGeneratorComponent,
  //End Quiz

  //Start Reclamation
    AjouterReclamationComponent,
    ListeReclamationsComponent,
    AdminReclamationComponent,
    ListTeacherComponent,
    ReclamationStatsComponent,
  //End Reclamation

//start article

   
    ArticleComponent,
    ArticleDetailsComponent,
    AddArticleComponent,
    EditArticleComponent,
    BackArticleComponent,
    FavoritesComponent,
    ChatbotComponent,
    LineToBrPipe,

    //machine learning
    PredictionComponent,
    ClusteringComponent,
    RecommandationComponent,


  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    RecaptchaModule,
    RecaptchaFormsModule,
    NgChartsModule
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' },ArticleServiceService, TranslationService,TextToSpeechService,FavoriteService, SimilarArticlesService, ChatbotService],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
    registerLocaleData(localeFr);
  }
 }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponentLogin } from './components/TemplateComponents/home-login/home.login.component';
import { HomeComponentLogout } from './components/TemplateComponents/home-logout/home.logout.component';
import { DashboardComponent } from './components/TemplateComponents/dashboard/dashboard.component';
import { FrontHeaderTeacherComponent } from './components/TemplateComponents/front-header-teacher/front-header-teacher.component';
import { FrontFooterComponent } from './components/TemplateComponents/front-footer/front-footer.component';
import { CoursesListComponent } from './components/GuestionCourseComponents/courses-list/courses-list.component';
import { AdminCoursesComponent } from './components/GuestionCourseComponents/admin-courses/admin-courses.component';
import { DashboardStatisticsComponent } from './components/GuestionCourseComponents/dashboard-statistics/dashboard-statistics.component';
import { AddDetailsCourseComponent } from './components/GuestionCourseComponents/add-details-course/add-details-course.component';
import { DetailsCourseComponent } from './components/GuestionCourseComponents/details-course/details-course.component';
import { FavoritCoursesComponent } from './components/GuestionCourseComponents/favorit-courses/favorit-courses.component';
import { CoursesSoonComponent } from './components/GuestionCourseComponents/courses-soon/courses-soon.component';
import { CoursesTeachersComponent } from './components/GuestionCourseComponents/courses-teachers/courses-teachers.component';
import { LoginComponent } from './components/GuestionUserComponents/login/login.component';
import { SignupComponent } from './components/GuestionUserComponents/signup/signup.component';
import { ProfileComponent } from './components/GuestionUserComponents/profile/profile.component';
import { UsersListComponent } from './components/GuestionUserComponents/users-list/users-list.component';
import { ResetPasswordComponent } from './components/GuestionUserComponents/reset-password/reset-password.component';
import { AuthGuard } from './auth.guard';
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
import { StripePaymentComponent } from './components/GuestionQuizComponents/stripe-payment/stripe-payment.component';
import { TakeQuizTrainingComponent } from './components/GuestionQuizComponents/take-quiz-training/take-quiz-training.component';
import { QuizGeneratorComponent } from './components/GuestionQuizComponents/quiz-generator/quiz-generator.component';
import { AjouterReclamationComponent } from './components/GuestionReclamComponents/ajouter-reclamation/ajouter-reclamation.component';
import { ListeReclamationsComponent } from './components/GuestionReclamComponents/liste-reclamation/liste-reclamation.component';
import { ListTeacherComponent } from './components/GuestionReclamComponents/list-teacher/list-teacher.component';
import { AdminReclamationComponent } from './components/GuestionReclamComponents/admin-reclamation/admin-reclamation.component';
import { ReclamationStatsComponent } from './components/GuestionReclamComponents/reclamation-stats/reclamation-stats.component';
import { FavoritesComponent } from './components/GestionArticle/favorites/favorites.component';
import { BackArticleComponent } from './components/GestionArticle/back-article/back-article.component';
import { ArticleComponent } from './components/GestionArticle/article/article.component';
import { AddArticleComponent } from './components/GestionArticle/add-article/add-article.component';
import { ArticleDetailsComponent } from './components/GestionArticle/article-details/article-details.component';
import { EditArticleComponent } from './components/GestionArticle/edit-article/edit-article.component';
import { PredictionComponent } from './components/machineLearning/prediction/prediction.component';
import { ClusteringComponent } from './components/machineLearning/clustering/clustering.component';
import { RecommandationComponent } from './components/machineLearning/recommandation/recommandation.component';
import { StatUserComponent } from './components/GuestionUserComponents/stats-user/stats-user.component';

const routes: Routes = [

  { path: 'home-login',component:HomeComponentLogin },
  { path: 'home-logout',component:HomeComponentLogout },

  { path: 'front_header',component:FrontHeaderTeacherComponent },
  { path: 'front_footer',component:FrontFooterComponent },

  { path: 'dashboard', redirectTo: 'dashboard/listeusers', pathMatch: 'full' }, // Redirect for /dashboard
  { path: 'dashboard', component: DashboardComponent, children: [
    //machine Learning
    { path: 'prediction', component: PredictionComponent },
    { path: 'clustering', component: ClusteringComponent },
    {path: 'recommandation',component:RecommandationComponent},
    
    //User
    { path: 'listeusers', component: UsersListComponent, canActivate: [AuthGuard] },
    { path: 'User-stats', component: StatUserComponent },
    //Course
    { path: 'statcours', component: DashboardStatisticsComponent },
    { path: 'coursAdmin', component: AdminCoursesComponent },
    { path: 'Admindetailcourses/:id', component: AddDetailsCourseComponent },
    { path: 'coursteacher', component: AdminCoursesComponent },
    //Quiz
    { path: 'quiz-statistics', component: QuizStatisticsComponent },
    //Reclamation
    { path: 'adminrecalamtion', component: AdminReclamationComponent },
    { path: 'adminrecalamtion-stats', component: ReclamationStatsComponent },
    //Article
    { path: 'back-office', component: BackArticleComponent }
  ]},

//Start Courses
  { path: 'courses', component: CoursesListComponent },
  { path: 'adddetailCours', component: AddDetailsCourseComponent },
  { path: 'details/:id', component: DetailsCourseComponent },
  { path: 'courses/my-courses', component: FavoritCoursesComponent },
  { path: 'courses-coming-soon', component: CoursesSoonComponent },
  { path: 'courses-teachers', component: CoursesTeachersComponent },
  { path: 'Admindetailcourses/:id', component: AddDetailsCourseComponent },
//End Courses

//Start User
  { path: 'login',component:LoginComponent },
  { path: 'signup',component:SignupComponent },
  { path: 'profile',component:ProfileComponent, canActivate: [AuthGuard] },
  { path: 'reset-password/:token', component: ResetPasswordComponent },
//End User

//Start Quiz
  { path: 'quizzes/:courseId', component: QuizComponent },
  { path: 'questions/:quizId/course/:courseId', component: QuestionComponent },
  { path: 'responses/:id', component: ResponseComponent },

  { path: 'add-quiz/:courseId', component: AddQuizComponent },
  { path: 'add-question/:quizId', component: AddQuestionComponent },
  { path: 'responses/:quizId/:questionId/:courseId', component: ResponseComponent },

  { path: 'update-quiz/:quizId', component: UpdateQuizComponent },
  { path: 'update-question/:quizId/:id', component: UpdateQuestionComponent },
  { path: 'update-response/:questionId/:id', component: UpdateResponseComponent },

  { path: 'take-quiz/:quizId', component: TakeQuizComponent },
  { path: 'payement-stripe', component: StripePaymentComponent },
  { path: 'take-quiz-training/:quizId', component: TakeQuizTrainingComponent },
  { path: 'quiz-generator/:courseId', component: QuizGeneratorComponent },
//End Quiz

//Start Reclamation
  { path: 'add-claim', component:AjouterReclamationComponent },
  { path: 'list-claim', component: ListeReclamationsComponent },
  { path: 'liste-Teacher', component: ListTeacherComponent },
//End Reclamation

//start article 

  { path: 'articles', component: ArticleComponent },
  { path: 'articles/add', component: AddArticleComponent },
  { path: 'articles/:id', component: ArticleDetailsComponent },
  { path: 'articles/edit/:id', component: EditArticleComponent },
  { path: 'favorites', component: FavoritesComponent },
//End article 


  { path: '', redirectTo: '/home-logout', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
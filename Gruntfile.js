//
// Grunttask runners
//
module.exports = function(grunt) {

	function merge(a,b){
		for(var x in b){
			a[x] = b[x];
		}
		return a;
	}

	function concat(name,define){
		var obj = {
			src: ['dist/'+name+'.js'],//, 'test/**/*.js'],
			dest : 'dist/'+name+'.js'
		};
		if(define){
			obj.src.push('src/hello.amd.js');
		}
		return obj;
	}

	function require_options(name, opts){
		return {
			options: merge({
				baseUrl : 'src',
				name : name,
				out : 'dist/'+name+ (opts&&opts.optimize?'.min':'')+'.js',
				optimize : 'none',

				// FORMATTING
				'wrap': {
					'start': '(function(window,document,undefined){',
					'end': '})(window,document)',
				},
				onModuleBundleComplete: function (data) {
					var fs = require('fs'),
						amdclean = require('amdclean'),
						outputFile = data.path;

					fs.writeFileSync(outputFile, amdclean.clean({
						'filePath': outputFile
					}));
				}
			}, opts)
		};
	}

	// //////////////////////////
	// 
	// //////////////////////////

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		requirejs : {
			hello		: require_options('hello'),
			hello_all	: require_options('hello.all'),
			redirect	: require_options('hello.redirect'),
		},
		concat: {
			options: {
				//stripBanners: true,
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %> */\n',
			},
			hello		: concat('hello', true),
			hello_all	: concat('hello.all', true),
			redirect	: concat('hello.redirect'),
		},
		uglify : {
			options :{
				preserveComments : 'some',
				report : 'gzip'
			},
			build : {
				files : {
					'dist/hello.min.js' : 'dist/hello.js',
					'dist/hello.all.min.js' : 'dist/hello.all.js',
					'dist/hello.redirect.min.js' : 'dist/hello.redirect.js'
				}
			}
		},
		jshint: {
			files: ['Gruntfile.js', 'src/**/*.js'],//, 'test/**/*.js'],
			options: {
				// options here to override JSHint defaults
				globals: {
					console: true,
					module: true,
					document: true
				},
				// dont check dot notation
				sub :true
			}
		},
		watch: {
			files: ['<%= jshint.files %>'],
			tasks: ['jshint']
		},

		karma : {
			unit: {
				configFile: 'karma.conf.js'
//				autoWatch: true
			}
		},

		// Shunt files around
		shunt : {
			// Shunt the documents of our project
			docs : {
				'README.md' : './index.html'
			},
			// Combine the src files, create minified versions
			build : {
				'dist/hello.js' : ['src/hello.js', 'src/hello.amd.js'],
				'dist/hello.all.js' : ['src/hello.js', 'src/modules/', 'src/hello.amd.js']
			},
			minify : {
				'dist/hello.min.js' : 'dist/hello.js',
				'dist/hello.all.min.js' : 'dist/hello.all.js'
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('shunt');

	grunt.registerTask('test', ['jshint']);
	grunt.registerTask('default', ['jshint', 'requirejs', 'concat', 'uglify']);

};